'use client';
import { Search, Bell, Flag, Archive } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface TopbarProps {
  brand?: string;
  query?: string;
  onQueryChange?: (value: string) => void;
}

export default function Topbar({ brand = 'Jwala Lakshmi Jewellers', query = '', onQueryChange }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="topbar-logo">{brand}</span>
      </div>
      <div className="search-bar">
        <Search size={15} />
        <input
          value={query}
          onChange={e => onQueryChange?.(e.target.value)}
          placeholder="Search designs, vendors..."
        />
      </div>
      <div className="topbar-actions">
        <button className="icon-btn" id="notif-btn" aria-label="Notifications">
          <Bell size={16} />
          <span className="dot" />
        </button>
        <button className="icon-btn" id="flag-btn" aria-label="Reports">
          <Flag size={16} />
        </button>
        <button
          className={`icon-btn${pathname === '/requests' ? ' active' : ''}`}
          id="requests-btn"
          aria-label="Requests"
          onClick={() => router.push('/requests')}
        >
          <Archive size={16} />
        </button>
      </div>
    </header>
  );
}
