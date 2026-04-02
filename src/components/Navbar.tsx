import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/looper', label: 'Looper', children: [
    { path: '/looper', label: 'About' },
    { path: '/looper/community', label: 'Community' },
  ]},
  { path: '/support', label: 'Support' },
];

export default function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLooperMenu, setShowLooperMenu] = useState(false);

  // Listen for auth success from popup
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.type === "LOOPER_AUTH_SUCCESS") {
        if (e.data.isNewUser) {
          // New user — redirect to username setup after reload
          localStorage.setItem("looper_pending_username_setup", "1");
        }
        window.location.reload();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!showDropdown && !showLooperMenu) return;
    const close = () => { setShowDropdown(false); setShowLooperMenu(false); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showDropdown, showLooperMenu]);

  return (
    <header>
      <div className="stripe-bar">
        <div className="red" />
        <div className="green" />
        <div className="yellow" />
      </div>
      <nav className="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="navbar-logo">
            <span className="navbar-logo-accent">Archald</span>Studio
          </Link>

          <button
            className="navbar-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span style={{
              transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none',
            }} />
            <span style={{
              opacity: menuOpen ? 0 : 1,
            }} />
            <span style={{
              transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none',
            }} />
          </button>

          <ul className={`navbar-links ${menuOpen ? 'navbar-links--open' : ''}`}>
            {navLinks.map((item) => (
              <li key={item.path} style={item.children ? { position: "relative" } : undefined}>
                {item.children ? (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowLooperMenu(!showLooperMenu); }}
                      className={`navbar-link${
                        location.pathname.startsWith('/looper') ? ' navbar-link--active' : ''
                      }`}
                      style={{ background: "none", border: "none", cursor: "pointer", font: "inherit", padding: 0 }}
                    >
                      {item.label} <span style={{ fontSize: "0.6em", marginLeft: 3, opacity: 0.6 }}>▼</span>
                    </button>
                    {showLooperMenu && (
                      <div style={styles.looperDropdown} onClick={(e) => e.stopPropagation()}>
                        {item.children.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={() => { setShowLooperMenu(false); setMenuOpen(false); }}
                            style={{
                              ...styles.looperDropdownItem,
                              ...(location.pathname === child.path ||
                                (child.path === '/looper/community' && (location.pathname.startsWith('/looper/post/') || location.pathname.startsWith('/looper/user/')))
                                ? { color: "var(--accent-red)" } : {}),
                            }}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.path}
                    onClick={() => setMenuOpen(false)}
                    className={`navbar-link${location.pathname === item.path ? ' navbar-link--active' : ''}`}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}

            {/* Auth button */}
            <li>
              {user ? (
                <div style={{ position: "relative" }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
                    style={styles.avatarBtn}
                    aria-label="User menu"
                  >
                    <div style={styles.avatar}>
                      {(user.email || "U")[0].toUpperCase()}
                    </div>
                  </button>
                  {showDropdown && (
                    <div style={styles.dropdown} onClick={(e) => e.stopPropagation()}>
                      <div style={styles.dropdownEmail}>{user.email}</div>
                      <div style={styles.dropdownDivider} />
                      <button onClick={() => { navigate("/profile"); setShowDropdown(false); }} style={styles.dropdownItem}>
                        Profile
                      </button>
                      <button onClick={() => { signOut(); setShowDropdown(false); }} style={styles.dropdownItem}>
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => navigate("/auth/signin")} style={styles.signInBtn}>
                  Sign in
                </button>
              )}
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  looperDropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "var(--bg-light)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "6px 0",
    minWidth: 150,
    zIndex: 100,
    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
  },
  looperDropdownItem: {
    display: "block",
    padding: "8px 18px",
    fontSize: "0.85rem",
    color: "var(--text)",
    textDecoration: "none",
    fontFamily: "var(--font-body)",
    fontWeight: 500,
    whiteSpace: "nowrap" as const,
    transition: "color 0.2s",
  },
  signInBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 2,
    backgroundColor: "var(--accent-red)",
    color: "#fff",
    border: "none",
    borderRadius: 20,
    padding: "7px 16px 7px 12px",
    fontSize: "0.82rem",
    fontWeight: 600,
    fontFamily: "var(--font-body)",
    cursor: "pointer",
    transition: "opacity 0.2s",
    whiteSpace: "nowrap",
  },
  avatarBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    backgroundColor: "var(--accent-red)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.85rem",
    fontWeight: 700,
    fontFamily: "var(--font-display)",
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    backgroundColor: "var(--bg-light)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: "8px 0",
    minWidth: 200,
    zIndex: 100,
    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
  },
  dropdownEmail: {
    padding: "8px 16px",
    fontSize: "0.78rem",
    color: "var(--text-subtle)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: "var(--border)",
    margin: "4px 0",
  },
  dropdownItem: {
    display: "block",
    width: "100%",
    textAlign: "left",
    background: "none",
    border: "none",
    padding: "8px 16px",
    fontSize: "0.85rem",
    color: "var(--text)",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
  },
};
