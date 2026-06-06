'use client';

import Link from 'next/link';
import FootballLogo from './FootballLogo';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">

        {/* Column 1: Brand Info */}
        <div className="footer-brand-col">
          <div className="footer-logo">
            <span className="footer-logo-icon">
              <FootballLogo />
            </span>
            <span className="footer-logo-text">DIU FIFA Community</span>
          </div>
          <p className="footer-tagline">
            Connecting football gamers and fans across Daffodil International University. Compete, connect, and represent.
          </p>
        </div>

        {/* Column 2: Platform Links */}
        <div className="footer-links-col">
          <h4 className="footer-col-title">Platform</h4>
          <ul className="footer-links-list">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/dashboard">Dashboard</Link></li>
            <li><Link href="/vote">Vote</Link></li>
            <li><Link href="/standings">Live Standings</Link></li>
          </ul>
        </div>


        {/* Column 4: Developer Profile */}
        <div className="footer-developer-col">
          <h4 className="footer-col-title">Developed By</h4>
          <div className="developer-card">
            <div className="developer-info">
              <div className="developer-avatar-wrapper">
                <img
                  src="/ratul.jpg"
                  alt="Ratul"
                  className="developer-avatar"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div className="developer-avatar-fallback">R</div>
              </div>
              <div className="developer-details">
                <h5 className="developer-name">Ratul</h5>
                <p className="developer-role">Developer</p>
              </div>
            </div>
            <div className="developer-socials">
              <a
                href="https://www.linkedin.com/in/mahmud-hasan-ratul-0831b9257"
                target="_blank"
                rel="noopener noreferrer"
                className="social-btn linkedin"
                title="LinkedIn"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/mahmud.hasan.ratul.76669"
                target="_blank"
                rel="noopener noreferrer"
                className="social-btn facebook"
                title="Facebook"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1V12h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z" />
                </svg>
              </a>
              <a
                href="https://mh-ratul.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-btn portfolio"
                title="Portfolio"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </a>
              <a
                href="https://www.instagram.com/_ratul_notfound_/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-btn instagram"
                title="Instagram"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
