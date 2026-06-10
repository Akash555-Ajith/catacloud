'use client';

import React, { useState } from 'react';

export default function GoogleOAuthSimulator() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState(1);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      alert('Please enter a valid Google Account email.');
      return;
    }
    setStep(2);
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter your name.');
      return;
    }

    if (window.opener) {
      window.opener.postMessage(
        {
          type: 'GOOGLE_SIGNIN',
          email: email.trim().toLowerCase(),
          name: name.trim()
        },
        window.location.origin
      );
    }
    window.close();
  };

  const selectPredefinedAccount = (pEmail: string, pName: string) => {
    if (window.opener) {
      window.opener.postMessage(
        {
          type: 'GOOGLE_SIGNIN',
          email: pEmail.toLowerCase(),
          name: pName
        },
        window.location.origin
      );
    }
    window.close();
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      color: '#202124',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '450px',
        border: '1px solid #dadce0',
        borderRadius: '8px',
        padding: '40px',
        boxSizing: 'border-box'
      }}>
        {/* Google Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <svg width="74" height="24" viewBox="0 0 74 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.25 18.2C6.11 18.2 3.51 15.63 3.51 12.1C3.51 8.57 6.11 6 9.25 6C10.79 6 12.08 6.6 13.06 7.53L10.97 9.62C10.28 8.97 9.4 8.61 8.35 8.61C6.27 8.61 4.7 10.29 4.7 12.37C4.7 14.45 6.27 16.13 8.35 16.13C9.9 16.13 10.78 15.51 11.34 14.95C11.92 14.37 12.3 13.55 12.45 12.35H8.35V9.75H15.1C15.2 10.12 15.25 10.58 15.25 11.08C15.25 13.18 14.67 15.7 13.28 17.08C11.93 18.45 10.45 19.2 8.35 19.2H9.25ZM22.5 18.2C19.78 18.2 17.58 16.03 17.58 13.1C17.58 10.17 19.78 8 22.5 8C25.22 8 27.42 10.17 27.42 13.1C27.42 16.03 25.22 18.2 22.5 18.2ZM22.5 10.61C20.89 10.61 19.46 11.9 19.46 13.1C19.46 14.3 20.89 15.59 22.5 15.59C24.11 15.59 25.54 14.3 25.54 13.1C25.54 11.9 24.11 10.61 22.5 10.61ZM34.7 18.2C31.98 18.2 29.78 16.03 29.78 13.1C29.78 10.17 31.98 8 34.7 8C37.42 8 39.62 10.17 39.62 13.1C39.62 16.03 37.42 18.2 34.7 18.2ZM34.7 10.61C33.09 10.61 31.66 11.9 31.66 13.1C31.66 14.3 33.09 15.59 34.7 15.59C36.31 15.59 37.74 14.3 37.74 13.1C37.74 11.9 36.31 10.61 34.7 10.61ZM46.85 18.2C44.75 18.2 43.15 17.25 42.3 15.58L45.42 14.28C45.92 15.1 46.85 15.65 47.95 15.65C49.4 15.65 50.15 14.85 50.15 13.5V12.8H49.95C49.3 13.55 48.05 14.1 46.75 14.1C44.05 14.1 41.75 11.85 41.75 8.9C41.75 5.95 44.05 3.7 46.75 3.7C48.05 3.7 49.3 4.25 49.95 5H50.15V4.2H53.15V13.3C53.15 16.5 51.15 18.2 48.15 18.2H46.85ZM47.2 6.31C45.55 6.31 44.15 7.6 44.15 8.9C44.15 10.2 45.55 11.49 47.2 11.49C48.85 11.49 50.25 10.2 50.25 8.9C50.25 7.6 48.85 6.31 47.2 6.31ZM56.75 18.2V0.8H60.25V18.2H56.75ZM68.15 18.2C65.55 18.2 63.45 16.03 63.45 13.1C63.45 10.17 65.55 8 68.15 8C70.75 8 72.7 10.1 72.7 13.1C72.7 13.5 72.65 13.9 72.55 14.2H66.65C66.85 15.3 67.8 15.9 68.85 15.9C69.95 15.9 70.8 15.4 71.35 14.65L74 16.4C73.15 17.5 71.35 18.2 68.15 18.2ZM68.15 10.39C66.85 10.39 65.55 11.39 65.55 12.8H70.75C70.65 11.49 69.45 10.39 68.15 10.39Z" fill="#1A73E8"/>
            <path d="M9.25 18.2C6.11 18.2 3.51 15.63 3.51 12.1C3.51 8.57 6.11 6 9.25 6C10.79 6 12.08 6.6 13.06 7.53L10.97 9.62C10.28 8.97 9.4 8.61 8.35 8.61C6.27 8.61 4.7 10.29 4.7 12.37C4.7 14.45 6.27 16.13 8.35 16.13C9.9 16.13 10.78 15.51 11.34 14.95C11.92 14.37 12.3 13.55 12.45 12.35H8.35V9.75H15.1C15.2 10.12 15.25 10.58 15.25 11.08C15.25 13.18 14.67 15.7 13.28 17.08C11.93 18.45 10.45 19.2 8.35 19.2H9.25Z" fill="#4285F4"/>
            <path d="M34.7 18.2C31.98 18.2 29.78 16.03 29.78 13.1C29.78 10.17 31.98 8 34.7 8C37.42 8 39.62 10.17 39.62 13.1C39.62 16.03 37.42 18.2 34.7 18.2Z" fill="#EA4335"/>
            <path d="M22.5 18.2C19.78 18.2 17.58 16.03 17.58 13.1C17.58 10.17 19.78 8 22.5 8C25.22 8 27.42 10.17 27.42 13.1C27.42 16.03 25.22 18.2 22.5 18.2Z" fill="#FBBC05"/>
            <path d="M46.85 18.2C44.75 18.2 43.15 17.25 42.3 15.58L45.42 14.28C45.92 15.1 46.85 15.65 47.95 15.65C49.4 15.65 50.15 14.85 50.15 13.5V12.8H49.95C49.3 13.55 48.05 14.1 46.75 14.1C44.05 14.1 41.75 11.85 41.75 8.9C41.75 5.95 44.05 3.7 46.75 3.7C48.05 3.7 49.3 4.25 49.95 5H50.15V4.2H53.15V13.3C53.15 16.5 51.15 18.2 48.15 18.2H46.85Z" fill="#34A853"/>
          </svg>
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 400, textAlign: 'center', margin: '0 0 8px 0' }}>
          {step === 1 ? 'Sign in' : 'Confirm your name'}
        </h1>
        <p style={{ fontSize: '16px', textAlign: 'center', margin: '0 0 28px 0', color: '#202124' }}>
          to continue to CataCloud Sourcing Platform
        </p>

        {step === 1 ? (
          <form onSubmit={handleNext}>
            {/* Email field */}
            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email or phone"
                style={{
                  width: '100%',
                  height: '56px',
                  borderRadius: '4px',
                  border: '1px solid #dadce0',
                  padding: '0 16px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                onBlur={(e) => e.target.style.borderColor = '#dadce0'}
              />
            </div>

            {/* Predefined Quick Accounts */}
            <div style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '13px', color: '#5f6368', display: 'block', marginBottom: '10px' }}>Choose a standard account to test quickly:</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { email: 'alex.retailer@gmail.com', name: 'Alex Retailer' },
                  { email: 'sourcing.pro@gmail.com', name: 'Sourcing Pro' },
                  { email: 'admin@gmail.com', name: 'Admin Manager' }
                ].map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => selectPredefinedAccount(acc.email, acc.name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      border: '1px solid #dadce0',
                      borderRadius: '4px',
                      background: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      textAlign: 'left',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f7f8f9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#1a73e8',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '12px'
                    }}>
                      {acc.name.charAt(0)}
                    </div>
                    <div>
                      <strong style={{ display: 'block', color: '#3c4043' }}>{acc.name}</strong>
                      <span style={{ fontSize: '12px', color: '#5f6368' }}>{acc.email}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
              <button
                type="button"
                onClick={() => window.close()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1a73e8',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: '8px 0'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  backgroundColor: '#1a73e8',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)'
                }}
              >
                Next
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignIn}>
            {/* Display name field */}
            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Display Name"
                style={{
                  width: '100%',
                  height: '56px',
                  borderRadius: '4px',
                  border: '1px solid #dadce0',
                  padding: '0 16px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                onBlur={(e) => e.target.style.borderColor = '#dadce0'}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1a73e8',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: '8px 0'
                }}
              >
                Back
              </button>
              <button
                type="submit"
                style={{
                  backgroundColor: '#1a73e8',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)'
                }}
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
