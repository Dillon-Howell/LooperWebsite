import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/looper', label: 'Looper' },
  { path: '/looper/community', label: 'Community' },
  { path: '/support', label: 'Support' },
];

export default function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

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
            {navLinks.map(({ path, label }) => (
              <li key={path}>
                <Link
                  to={path}
                  onClick={() => setMenuOpen(false)}
                  className={`navbar-link${
                    location.pathname === path ||
                    (path === '/looper/community' && (location.pathname.startsWith('/looper/post/') || location.pathname.startsWith('/looper/user/')))
                      ? ' navbar-link--active' : ''
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
