import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  immersive?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, immersive = false }) => {
  return (
    <div className={`relative min-h-screen overflow-hidden text-ink-900 ${immersive ? 'bg-[#efeee7]' : 'bg-[#f5f2eb]'}`}>
      <main className="relative z-10">{children}</main>
    </div>
  );
};
