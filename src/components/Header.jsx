import React from 'react';
import './Header.css';

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <span className="header-logo" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="3" width="12" height="15" rx="1" stroke="#6b9fd4" strokeWidth="1.2" fill="none" />
              <path d="M5 7h6M5 10h6M5 13h4" stroke="#6b9fd4" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="15.5" cy="15.5" r="3" fill="#132040" stroke="#4a7fc1" strokeWidth="1.2" />
              <path d="M14 15.5h3M15.5 14v3" stroke="#4a7fc1" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </span>
          <span className="header-title">AI Design Brief Checker</span>
        </div>
        <div className="header-meta">
          <span className="header-badge">Architecture Studio Tool</span>
          <span className="header-version">v1.0</span>
        </div>
      </div>
    </header>
  );
}
