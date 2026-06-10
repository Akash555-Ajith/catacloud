'use client';

import React, { useState } from 'react';

export default function GoogleOAuthSimulator() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState(1);
  const [isInputFocused, setIsInputFocused] = useState(false);

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
      alert('Please enter your name to proceed.');
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

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#131314',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"Google Sans", Roboto, Helvetica, Arial, sans-serif',
      color: '#e3e3e3',
      boxSizing: 'border-box',
      position: 'relative'
    }}>
      {/* Main Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 12px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1040px',
          backgroundColor: '#0f0f0f',
          border: '1px solid #444746',
          borderRadius: '28px',
          padding: '40px',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '48px',
          boxSizing: 'border-box'
        }}>
          
          {/* Left Column (Brand info) */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            {/* Google G Logo */}
            <div style={{ marginBottom: '20px' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>

            {step === 1 ? (
              <>
                <h1 style={{ fontSize: '36px', fontWeight: 400, color: '#e3e3e3', margin: '0 0 16px 0', lineHeight: '1.2' }}>
                  Sign in
                </h1>
                <p style={{ fontSize: '16px', color: '#c4c7c5', margin: 0, lineHeight: '1.5' }}>
                  with your Google Account. This account will be available to other Google apps in the browser.
                </p>
              </>
            ) : (
              <>
                <h1 style={{ fontSize: '36px', fontWeight: 400, color: '#e3e3e3', margin: '0 0 16px 0', lineHeight: '1.2' }}>
                  Welcome
                </h1>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '100px',
                  border: '1px solid #444746',
                  backgroundColor: '#1e1f20',
                  color: '#e3e3e3',
                  fontSize: '14px',
                  fontWeight: 500,
                  width: 'fit-content'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#0b57d0',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    {email.charAt(0).toUpperCase()}
                  </div>
                  <span>{email}</span>
                </div>
              </>
            )}
          </div>

          {/* Right Column (Input & Form actions) */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {step === 1 ? (
              <form onSubmit={handleNext} style={{ display: 'flex', flexDirection: 'column' }}>
                
                {/* Floating label style input container */}
                <div style={{ position: 'relative', marginBottom: '8px', width: '100%' }}>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    style={{
                      width: '100%',
                      height: '56px',
                      backgroundColor: 'transparent',
                      border: isInputFocused ? '2px solid #a8c7fa' : '1px solid #8e918f',
                      borderRadius: '4px',
                      padding: '0 16px',
                      fontSize: '16px',
                      color: '#e3e3e3',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s ease'
                    }}
                  />
                  {/* Floating Label */}
                  <label style={{
                    position: 'absolute',
                    left: '16px',
                    top: (isInputFocused || email) ? '-10px' : '16px',
                    backgroundColor: '#0f0f0f',
                    padding: '0 4px',
                    fontSize: (isInputFocused || email) ? '12px' : '16px',
                    color: isInputFocused ? '#a8c7fa' : '#8e918f',
                    pointerEvents: 'none',
                    transition: 'all 0.15s ease'
                  }}>
                    Email or phone
                  </label>
                </div>

                <a href="#forgot" style={{
                  color: '#a8c7fa',
                  fontSize: '14px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  marginBottom: '36px',
                  width: 'fit-content'
                }}>
                  Forgot email?
                </a>

                <p style={{
                  fontSize: '14px',
                  color: '#c4c7c5',
                  lineHeight: '1.5',
                  margin: '0 0 40px 0'
                }}>
                  Not your computer? Use Guest mode to sign in privately.{' '}
                  <a href="#guest" style={{ color: '#a8c7fa', textDecoration: 'none', fontWeight: 500 }}>
                    Learn more about using Guest mode
                  </a>
                </p>

                {/* Footer Buttons */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '12px'
                }}>
                  <a href="#create" style={{
                    color: '#a8c7fa',
                    fontSize: '14px',
                    fontWeight: 500,
                    textDecoration: 'none'
                  }}>
                    Create account
                  </a>
                  
                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#a8c7fa',
                      color: '#062e6f',
                      border: 'none',
                      borderRadius: '100px',
                      padding: '10px 24px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c2e7ff'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#a8c7fa'}
                  >
                    Next
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column' }}>
                
                {/* Floating label style input container */}
                <div style={{ position: 'relative', marginBottom: '36px', width: '100%' }}>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    style={{
                      width: '100%',
                      height: '56px',
                      backgroundColor: 'transparent',
                      border: isInputFocused ? '2px solid #a8c7fa' : '1px solid #8e918f',
                      borderRadius: '4px',
                      padding: '0 16px',
                      fontSize: '16px',
                      color: '#e3e3e3',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s ease'
                    }}
                  />
                  {/* Floating Label */}
                  <label style={{
                    position: 'absolute',
                    left: '16px',
                    top: (isInputFocused || name) ? '-10px' : '16px',
                    backgroundColor: '#0f0f0f',
                    padding: '0 4px',
                    fontSize: (isInputFocused || name) ? '12px' : '16px',
                    color: isInputFocused ? '#a8c7fa' : '#8e918f',
                    pointerEvents: 'none',
                    transition: 'all 0.15s ease'
                  }}>
                    Display Name / Full Name
                  </label>
                </div>

                <p style={{
                  fontSize: '14px',
                  color: '#c4c7c5',
                  lineHeight: '1.5',
                  margin: '0 0 40px 0'
                }}>
                  Please enter your full name. This will be used as your display name inside the CataCloud Sourcing Platform.
                </p>

                {/* Footer Buttons */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '12px'
                }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#a8c7fa',
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
                      backgroundColor: '#a8c7fa',
                      color: '#062e6f',
                      border: 'none',
                      borderRadius: '100px',
                      padding: '10px 24px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c2e7ff'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#a8c7fa'}
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Footer links */}
      <footer style={{
        padding: '0 40px 24px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: '#c4c7c5',
        flexShrink: 0
      }}>
        <div>
          <select style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#c4c7c5',
            fontSize: '12px',
            outline: 'none',
            cursor: 'pointer'
          }}>
            <option value="en-US">English (United States)</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <a href="#help" style={{ color: '#c4c7c5', textDecoration: 'none' }}>Help</a>
          <a href="#privacy" style={{ color: '#c4c7c5', textDecoration: 'none' }}>Privacy</a>
          <a href="#terms" style={{ color: '#c4c7c5', textDecoration: 'none' }}>Terms</a>
        </div>
      </footer>
    </div>
  );
}
