/**
 * Web Audio API preview player for .looper bundles.
 *
 * Downloads the bundle via presigned URL, decodes all track audio from
 * base64, mixes them respecting timeline offset/trim/volume/pan, and
 * plays the result.
 */

import { getStreamUrl } from "./api";

interface Track {
  id: string;
  name: string;
  volume: number;
  pan: number;
  muted: boolean;
  trimStart: number;
  trimEnd: number;
  timelineOffset: number;
  loopMode: string;
}

let audioContext: AudioContext | null = null;
let activeSource: AudioBufferSourceNode | null = null;
let currentPostId: string | null = null;
let _isPlaying = false;
let autoStopTimer: ReturnType<typeof setTimeout> | null = null;

function getContext(): AudioContext {
  if (!audioContext || audioContext.state === "closed") {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}

export function stopPreview(): void {
  if (autoStopTimer) {
    clearTimeout(autoStopTimer);
    autoStopTimer = null;
  }
  if (activeSource) {
    try { activeSource.stop(0); } catch { /* already stopped */ }
    activeSource = null;
  }
  currentPostId = null;
  _isPlaying = false;
}

export function isPreviewPlaying(postId?: string): boolean {
  if (postId) return _isPlaying && currentPostId === postId;
  return _isPlaying;
}

export function getCurrentPostId(): string | null {
  return currentPostId;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function mixdown(
  ctx: AudioContext,
  tracks: Track[],
  bufferMap: Map<string, AudioBuffer>
): AudioBuffer {
  const sampleRate = ctx.sampleRate;

  interface MixEntry {
    pcm: Float32Array;
    volume: number;
    pan: number;
    offset: number;
    trimmedDuration: number;
  }

  const entries: MixEntry[] = [];

  for (const track of tracks) {
    if (track.muted) continue;
    const fullBuffer = bufferMap.get(track.id);
    if (!fullBuffer) continue;

    const trimStartSample = Math.floor(track.trimStart * sampleRate);
    const trimEndSample = Math.min(
      Math.ceil(track.trimEnd * sampleRate),
      fullBuffer.length
    );
    const trimLength = Math.max(0, trimEndSample - trimStartSample);
    if (trimLength === 0) continue;

    const srcChannel = fullBuffer.getChannelData(0);
    const trimmedData = new Float32Array(trimLength);
    for (let i = 0; i < trimLength; i++) {
      trimmedData[i] = srcChannel[trimStartSample + i];
    }

    entries.push({
      pcm: trimmedData,
      volume: track.volume,
      pan: track.pan,
      offset: track.timelineOffset,
      trimmedDuration: trimLength / sampleRate,
    });
  }

  if (entries.length === 0) {
    throw new Error("No playable tracks after mixing");
  }

  const naturalDuration = Math.max(
    ...entries.map((e) => e.offset + e.trimmedDuration),
    0.1
  );
  const totalLength = Math.ceil(naturalDuration * sampleRate);

  const leftOut = new Float32Array(totalLength);
  const rightOut = new Float32Array(totalLength);

  for (const entry of entries) {
    const leftGain = entry.volume * Math.cos(((entry.pan + 1) / 2) * Math.PI * 0.5);
    const rightGain = entry.volume * Math.sin(((entry.pan + 1) / 2) * Math.PI * 0.5);
    const offsetSamples = Math.floor(entry.offset * sampleRate);
    const pcmLen = entry.pcm.length;
    const samplesToMix = Math.min(pcmLen, totalLength - offsetSamples);
    for (let i = 0; i < samplesToMix; i++) {
      leftOut[offsetSamples + i] += entry.pcm[i] * leftGain;
      rightOut[offsetSamples + i] += entry.pcm[i] * rightGain;
    }
  }

  const mixedBuffer = ctx.createBuffer(2, totalLength, sampleRate);
  const mixL = mixedBuffer.getChannelData(0);
  const mixR = mixedBuffer.getChannelData(1);
  for (let i = 0; i < totalLength; i++) {
    mixL[i] = leftOut[i];
    mixR[i] = rightOut[i];
  }

  return mixedBuffer;
}

export async function playPreview(
  s3Key: string,
  postId: string,
  onEnd?: () => void
): Promise<void> {
  // Toggle behavior
  if (_isPlaying && currentPostId === postId) {
    stopPreview();
    onEnd?.();
    return;
  }

  stopPreview();
  currentPostId = postId;
  _isPlaying = true;
  try {
    const { downloadUrl } = await getStreamUrl(s3Key);
    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error(`Download failed (${response.status})`);
    const content = await response.text();
    const bundle = JSON.parse(content);

    if (!bundle.tracks || !bundle.audioData) {
      throw new Error("Invalid .looper bundle");
    }

    const ctx = getContext();
    const bufferMap = new Map<string, AudioBuffer>();

    for (const track of bundle.tracks as Track[]) {
      const base64 = bundle.audioData[track.id];
      if (!base64) continue;
      try {
        const arrayBuffer = base64ToArrayBuffer(base64);
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        bufferMap.set(track.id, audioBuffer);
      } catch (e) {
        console.warn(`Preview: skipping track ${track.id}:`, e);
      }
    }

    if (bufferMap.size === 0) throw new Error("No playable tracks found");
    if (currentPostId !== postId) { onEnd?.(); return; }

    const mixedBuffer = mixdown(ctx, bundle.tracks as Track[], bufferMap);
    const source = ctx.createBufferSource();
    source.buffer = mixedBuffer;
    const gainNode = ctx.createGain();
    gainNode.gain.value = 1.0;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(ctx.currentTime + 0.05);
    activeSource = source;

    autoStopTimer = setTimeout(() => {
      if (currentPostId === postId) {
        stopPreview();
        onEnd?.();
      }
    }, (mixedBuffer.duration + 0.1) * 1000);
  } catch (error) {
    stopPreview();
    throw error;
  }
}
