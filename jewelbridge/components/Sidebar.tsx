'use client';
import { Home, Plus, User } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { label: 'Home', icon: Home, href: '/home' },
  { label: 'Post', icon: Plus, href: '/post', isPost: true },
  { label: 'Profile', icon: User, href: '/profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="bottom-nav">
      {navItems.map(({ label, icon: Icon, href, isPost }) => (
        <button
          key={href}
          id={`nav-${label.toLowerCase()}`}
          className={`nav-link${isPost ? ' nav-post' : ''}${pathname === href ? ' active' : ''}`}
          onClick={() => router.push(href)}
          aria-label={label}
        >
          <Icon size={isPost ? 22 : 20} />
          {!isPost && label}
        </button>
      ))}
    </nav>
  );
}
