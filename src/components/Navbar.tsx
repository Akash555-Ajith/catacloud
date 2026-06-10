'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { StoreConfig, SEAFOOD_PRESET } from '@/data/storeConfig';
import { getStoreConfig, dbGetUser, dbSaveUser } from '@/utils/store';

const PRESET_AVATARS = [
  { name: 'Bluefin Tuna', url: '/images/bluefin_tuna.png' },
  { name: 'King Salmon', url: '/images/king_salmon.png' },
  { name: 'Tiger Prawns', url: '/images/tiger_prawns.png' },
  { name: 'Atlantic Halibut', url: '/images/atlantic_halibut.png' },
  { name: 'Master Chef', url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&q=80' },
  { name: 'Gourmet Kitchen', url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=150&q=80' },
  { name: 'Ocean Currents', url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=150&q=80' },
  { name: 'Abyssal Luxury', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80' }
];

interface NavbarProps {
  cartCount: number;
  onCartToggle: () => void;
  onLogout: () => void;
  storeId?: string;
}

export default function Navbar({ cartCount, onCartToggle, onLogout, storeId }: NavbarProps) {
  const [userName, setUserName] = useState<string>('Guest');
  const [userRole, setUserRole] = useState<string>('user');
  const [userAvatar, setUserAvatar] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(SEAFOOD_PRESET);
  
  // Profile Form state
  const [tempName, setTempName] = useState<string>('');
  const [tempAvatar, setTempAvatar] = useState<string>('');

  const pathname = usePathname();

  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem('bluefine_user');
      if (storedUser) {
        setIsLoggedIn(true);
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed && parsed.name) {
            setUserName(parsed.name);
          } else if (parsed && parsed.email) {
            setUserName(parsed.email.split('@')[0]);
          }
          if (parsed && parsed.role) {
            setUserRole(parsed.role);
          }
          if (parsed && parsed.avatar) {
            setUserAvatar(parsed.avatar);
          } else {
            setUserAvatar('');
          }
          if (parsed && parsed.email) {
            setUserEmail(parsed.email);
          }
        } catch {
          setUserName(storedUser);
        }
      } else {
        setIsLoggedIn(false);
        setUserName('Guest');
        setUserRole('user');
        setUserAvatar('');
        setUserEmail('');
      }
    };

    const loadStoreConfig = () => {
      let activeStore = storeId;
      if (!activeStore && typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        activeStore = params.get('store') || '';
        if (!activeStore) {
          const hostname = window.location.hostname;
          const parts = hostname.split('.');
          if (parts.length > 1 && parts[0] !== 'www' && parts[0] !== 'localhost' && !parts[0].includes('catacloud')) {
            activeStore = parts[0];
          }
        }
        if (!activeStore) {
          activeStore = localStorage.getItem('bluefine_current_store_id') || 'catacloud';
        }
      }
      if (!activeStore) activeStore = 'catacloud';
      getStoreConfig(activeStore).then(setStoreConfig);
    };

    const handleConfigUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const eventStoreId = customEvent.detail?.storeId;
      let activeStore = storeId;
      if (!activeStore && typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        activeStore = params.get('store') || '';
        if (!activeStore) {
          const hostname = window.location.hostname;
          const parts = hostname.split('.');
          if (parts.length > 1 && parts[0] !== 'www' && parts[0] !== 'localhost' && !parts[0].includes('catacloud')) {
            activeStore = parts[0];
          }
        }
        if (!activeStore) {
          activeStore = localStorage.getItem('bluefine_current_store_id') || 'catacloud';
        }
      }
      if (!activeStore) activeStore = 'catacloud';
      if (!eventStoreId || eventStoreId === activeStore) {
        getStoreConfig(activeStore).then(setStoreConfig);
      }
    };

    loadUser();
    loadStoreConfig();

    window.addEventListener('storage', loadUser);
    window.addEventListener('user-profile-updated', loadUser);
    window.addEventListener('store-config-updated', handleConfigUpdate);

    return () => {
      window.removeEventListener('storage', loadUser);
      window.removeEventListener('user-profile-updated', loadUser);
      window.removeEventListener('store-config-updated', handleConfigUpdate);
    };
  }, [storeId]);

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const handleOpenProfile = () => {
    setTempName(userName);
    setTempAvatar(userAvatar);
    setIsProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!tempName.trim()) {
      toast.error('Display Name cannot be empty');
      return;
    }

    const storedUser = localStorage.getItem('bluefine_user');
    let email = userEmail;
    let role = userRole;
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        email = parsed.email || userEmail;
        role = parsed.role || userRole;
      } catch {
        // ignore
      }
    }

    const updatedUser = {
      email,
      name: tempName.trim(),
      role: role as 'admin' | 'user',
      avatar: tempAvatar
    };

    try {
      const existingUser = await dbGetUser(email);
      await dbSaveUser({
        ...existingUser,
        ...updatedUser
      });
    } catch (err) {
      console.warn('Failed to save user in db', err);
    }

    localStorage.setItem('bluefine_user', JSON.stringify(updatedUser));
    
    // Update local state directly
    setUserName(updatedUser.name);
    setUserAvatar(updatedUser.avatar);

    // Dispatch custom event to sync cross-component
    window.dispatchEvent(new Event('user-profile-updated'));

    setIsProfileOpen(false);
    toast.success('Profile updated successfully!', {
      description: `Your name is now set to ${updatedUser.name}.`
    });
  };

  return (
    <header
      className="sticky top-0 z-50 w-full max-w-full flex items-center justify-between px-10 py-5 rounded-b-2xl rounded-t-none backdrop-blur-2xl transition-all duration-300 relative overflow-hidden"
      style={storeConfig.storeType === 'clothing' ? {
        background: 'rgba(12, 10, 8, 0.90)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.02)',
        borderLeft: '1px solid rgba(180,140,100,0.12)',
        borderRight: '1px solid rgba(180,140,100,0.12)',
        borderBottom: '1px solid rgba(180,140,100,0.12)',
      } : {
        background: 'rgba(8,12,24,0.88)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.03)',
        borderLeft: '1px solid rgba(255,255,255,0.05)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex items-center gap-4 group cursor-pointer z-10" onClick={() => window.location.href = storeId ? `/?store=${storeId}` : '/'}>
        {storeConfig.storeType === 'seafood' ? (
          <svg
            width="42"
            height="42"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: 'drop-shadow(0 0 12px rgba(0, 242, 254, 0.5))' }}
            className="transition-transform duration-500 group-hover:rotate-12 group-hover:scale-105"
          >
            <path
              d="M28 16C28 22.6274 22.6274 28 16 28C11.5 28 7.5 25.5 5 21.5C8 21.5 11.5 19.5 13.5 17C15.5 14.5 16 11.5 17.5 9.5C19 7.5 21.5 6 24 6C26 6 28 7 28 9C28 11 25.5 12.5 24 13.5C22.5 14.5 20.5 15.5 20.5 16.5C20.5 17.5 22 18.5 23.5 19C25 19.5 28 19 28 16Z"
              fill="url(#logo-grad)"
            />
            <path
              d="M4 16C4 9.37258 9.37258 4 16 4C19 4 21.5 5 22.5 6.5C19 7 16 9 14.5 11C13 13 12 15 10 16.5C8 18 6 18.5 4.5 18C4 17.5 4 17 4 16Z"
              fill="url(#logo-grad-accent)"
              opacity="0.7"
            />
            <defs>
              <linearGradient id="logo-grad" x1="5" y1="6" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00f2fe" />
                <stop offset="1" stopColor="#4facfe" />
              </linearGradient>
              <linearGradient id="logo-grad-accent" x1="4" y1="4" x2="22.5" y2="18" gradientUnits="userSpaceOnUse">
                <stop stopColor="#e2b744" />
                <stop offset="1" stopColor="#b88e1a" />
              </linearGradient>
            </defs>
          </svg>
        ) : storeConfig.storeType === 'egg' ? (
          <svg
            width="42"
            height="42"
            viewBox="0 0 24 24"
            fill="none"
            stroke="url(#logo-grad)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 12px rgba(0, 242, 254, 0.5))' }}
            className="transition-transform duration-500 group-hover:rotate-12 group-hover:scale-105"
          >
            <path d="M12 2C7.5 2 4 7 4 12c0 4.5 3.5 10 8 10s8-5.5 8-10c0-5-3.5-10-8-10z" fill="url(#logo-grad)" opacity="0.15" />
            <path d="M12 2C7.5 2 4 7 4 12c0 4.5 3.5 10 8 10s8-5.5 8-10c0-5-3.5-10-8-10z" />
            <defs>
              <linearGradient id="logo-grad" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00f2fe" />
                <stop offset="1" stopColor="#4facfe" />
              </linearGradient>
            </defs>
          </svg>
        ) : storeConfig.storeType === 'clothing' ? (
          <svg
            width="42"
            height="42"
            viewBox="0 0 24 24"
            fill="none"
            stroke="url(#clothing-logo-grad)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 12px rgba(212, 169, 106, 0.6))' }}
            className="transition-transform duration-500 group-hover:rotate-12 group-hover:scale-105"
          >
            <path d="M20.38 3.46L16 6.14V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3.14L3.62 3.46a1 1 0 0 0-1.42.34L.26 7.42a1 1 0 0 0 .34 1.42L4 11v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9l3.4-2.16a1 1 0 0 0 .34-1.42l-1.94-3.62a1 1 0 0 0-1.42-.34z" fill="url(#clothing-logo-grad)" opacity="0.15" />
            <path d="M20.38 3.46L16 6.14V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3.14L3.62 3.46a1 1 0 0 0-1.42.34L.26 7.42a1 1 0 0 0 .34 1.42L4 11v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9l3.4-2.16a1 1 0 0 0 .34-1.42l-1.94-3.62a1 1 0 0 0-1.42-.34z" />
            <defs>
              <linearGradient id="clothing-logo-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#d4a96a" />
                <stop offset="1" stopColor="#e8c47a" />
              </linearGradient>
            </defs>
          </svg>
        ) : (
          <svg
            width="42"
            height="42"
            viewBox="0 0 24 24"
            fill="none"
            stroke="url(#logo-grad)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 12px rgba(0, 242, 254, 0.5))' }}
            className="transition-transform duration-500 group-hover:rotate-12 group-hover:scale-105"
          >
            <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" fill="url(#logo-grad)" opacity="0.1" />
            <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            <defs>
              <linearGradient id="logo-grad" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00f2fe" />
                <stop offset="1" stopColor="#4facfe" />
              </linearGradient>
            </defs>
          </svg>
        )}
        <span
          className="font-heading text-3xl font-extrabold tracking-widest drop-shadow transition-all duration-300 group-hover:brightness-110"
          style={storeConfig.storeType === 'clothing' ? {
            backgroundImage: 'linear-gradient(135deg, #d4a96a 0%, #e8c47a 55%, #c08040 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 10px rgba(212,169,106,0.25))',
          } : {
            backgroundImage: 'linear-gradient(to right, #818cf8, #a5b4fc, #22d3ee)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 15px rgba(99,102,241,0.3))',
          }}
        >
          {storeConfig.storeName}
        </span>
      </div>

      {isLoggedIn && (
        <nav className="hidden md:block">
          <ul className="flex items-center gap-12 list-none m-0 p-0">
            <li>
              <Link 
                href="/dashboard" 
                className={`text-base font-semibold transition-all duration-300 relative pb-1.5 hover:text-indigo-300 flex items-center ${
                  pathname === '/dashboard' 
                    ? 'text-indigo-300 drop-shadow-[0_0_12px_rgba(99,102,241,0.4)] after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-500 after:rounded' 
                    : 'text-slate-400 after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-indigo-500 hover:after:w-full after:transition-all after:duration-300'
                }`}
              >
                <svg className="w-4.5 h-4.5 mr-2 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                Dashboard
              </Link>
            </li>
          </ul>
        </nav>
      )}

      <div className="flex items-center gap-8">
        {isLoggedIn ? (
          <>
            <button
              className="relative p-4 rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(0,242,254,0.08)] hover:border-[rgba(0,242,254,0.25)] transition-all duration-300 cursor-pointer text-[var(--text-primary)] hover:scale-105 hover:shadow-[0_0_20px_rgba(0,242,254,0.22)]"
              onClick={onCartToggle}
              aria-label="Toggle Shopping Cart"
              id="cart-toggle-btn"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {cartCount > 0 && (
                <span 
                  className="absolute -top-1.5 -right-1.5 flex h-6.5 w-6.5 items-center justify-center rounded-full bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-xs font-bold text-[#030812] shadow-[0_2px_12px_rgba(0,242,254,0.5)] border border-[#030812]"
                  id="cart-badge-count"
                >
                  {cartCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-4 pl-6 border-l border-[rgba(255,255,255,0.08)] py-3">
              <button 
                type="button"
                onClick={handleOpenProfile}
                className="cursor-pointer group/profile bg-transparent border-none p-1 text-left focus:outline-none shrink-0"
                title="Customize Profile"
              >
                <Avatar className="h-12 w-12 bg-[var(--accent-cyan)] shadow-[0_0_18px_rgba(0,242,254,0.55)] transition-transform duration-300 hover:scale-105 shrink-0 select-none">
                  {userAvatar && (
                    <AvatarImage src={userAvatar} alt={userName} className="object-cover" />
                  )}
                  <AvatarFallback className="text-xl font-black text-[#081426] bg-[var(--accent-cyan)]">
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
              </button>

              <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <DialogContent className="max-w-md bg-[rgba(8,20,38,0.98)] border border-[rgba(0,242,254,0.2)] text-[var(--text-primary)] p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl focus:outline-none">
                  <DialogHeader className="mb-4">
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] bg-clip-text text-transparent">
                      Customize Profile
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 text-sm mt-1">
                      Update your business name and choose a premium avatar representation.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex flex-col gap-5 py-4">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="profile-name" className="text-sm font-semibold text-[var(--accent-cyan)]">
                        Display Name
                      </label>
                      <input
                        id="profile-name"
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="luxury-input w-full h-11 px-4 rounded-xl border border-[rgba(0,242,254,0.15)] bg-[rgba(3,8,18,0.6)] text-white focus:border-[var(--accent-cyan)] focus:ring-1 focus:ring-[var(--accent-cyan)] transition-all focus:outline-none"
                        placeholder="Enter your display name"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-[var(--accent-cyan)] mb-1">
                        Select Avatar Icon
                      </span>
                      <div className="grid grid-cols-4 gap-3 max-h-44 overflow-y-auto pr-1">
                        {PRESET_AVATARS.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => setTempAvatar(preset.url)}
                            className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-300 ${
                              tempAvatar === preset.url
                                ? 'border-[var(--accent-cyan)] scale-105 shadow-[0_0_12px_rgba(0,242,254,0.4)]'
                                : 'border-[rgba(255,255,255,0.08)] hover:border-[rgba(0,242,254,0.25)]'
                            }`}
                            title={preset.name}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={preset.url}
                              alt={preset.name}
                              className="w-full h-full object-cover"
                            />
                            {tempAvatar === preset.url && (
                              <div className="absolute inset-0 bg-[rgba(0,242,254,0.15)] flex items-center justify-center">
                                <span className="text-white text-xs font-bold bg-[#030812] px-1.5 py-0.5 rounded border border-[var(--accent-cyan)]">✓</span>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="profile-avatar-url" className="text-sm font-semibold text-[var(--accent-cyan)]">
                        Or Custom Image URL
                      </label>
                      <input
                        id="profile-avatar-url"
                        type="url"
                        value={tempAvatar}
                        onChange={(e) => setTempAvatar(e.target.value)}
                        className="luxury-input w-full h-11 px-4 rounded-xl border border-[rgba(0,242,254,0.15)] bg-[rgba(3,8,18,0.6)] text-white focus:border-[var(--accent-cyan)] focus:ring-1 focus:ring-[var(--accent-cyan)] transition-all focus:outline-none"
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </div>
                  </div>

                  <DialogFooter className="mt-6 gap-3">
                    <DialogClose 
                      render={
                        <button
                          type="button"
                          className="px-5 py-2.5 rounded-xl border border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.05)] text-sm font-semibold text-slate-300 transition-all cursor-pointer"
                        />
                      }
                    >
                      Cancel
                    </DialogClose>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-slate-900 text-sm font-bold shadow-[0_4px_15px_rgba(0,242,254,0.3)] hover:scale-[1.02] transition-all cursor-pointer border-none"
                    >
                      Save Changes
                    </button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="flex flex-col items-start gap-1.5">
                <div className="flex items-center gap-2.5">
                  <button 
                    type="button"
                    onClick={handleOpenProfile}
                    className="text-xl font-bold text-white hover:text-[var(--accent-cyan)] transition-colors cursor-pointer border-none bg-none p-0 text-left focus:outline-none tracking-wide"
                  >
                    {userName}
                  </button>
                  <span className={`text-[11px] font-black px-3 py-0.5 rounded-full uppercase tracking-normal select-none border border-white/5 ${
                    userRole === 'admin' 
                      ? 'bg-[var(--accent-cyan)] text-[#081426] shadow-[0_0_12px_rgba(0,242,254,0.4)]' 
                      : 'bg-[var(--accent-gold)] text-[#081426] shadow-[0_0_12px_rgba(226,183,68,0.4)]'
                  }`}>
                    {userRole === 'admin' ? 'Admin' : 'Chef'}
                  </span>
                </div>
                <button 
                  className="flex items-center text-xs font-semibold text-white bg-transparent border border-red-500/20 rounded-full px-5 py-1.5 transition-all cursor-pointer shadow-[0_0_8px_rgba(239,68,68,0.05)] hover:bg-[rgba(239,68,68,0.1)] hover:border-red-500/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] select-none hover:scale-[1.02]"
                  onClick={onLogout} 
                  id="logout-button"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2 text-white"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-6">
            <Link 
              href="/login" 
              className="text-base font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link 
              href="/login" 
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-400 text-slate-950 text-sm font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:scale-105 transition-all cursor-pointer border-none"
            >
              Start for free
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
