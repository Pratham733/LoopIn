
"use client"; 

import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import AppSidebarContent from '@/components/layout/AppSidebarContent';
import Particles from '@/components/magicui/particles';

import { usePathname } from 'next/navigation'; 
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useEffect, useState, useMemo } from 'react';
import { useCustomTheme } from '@/contexts/CustomThemeContext';

const SIDEBAR_COLLAPSED_WIDTH_PX = 48; 
const SIDEBAR_EXPANDED_WIDTH_PX = 180;

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const { currentTheme } = useCustomTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const particleColor = useMemo(() => {
    if (!mounted) return null;
    
    // Always return a valid color
    if (resolvedTheme === 'dark') {
      return "hsl(0, 0%, 100%)"; // White for dark theme
    } else {
      return "hsl(0, 0%, 0%)"; // Black for light theme  
    }
  }, [mounted, resolvedTheme]);

  const mainContentClasses = cn(
    "relative flex-1 w-full overflow-y-auto transition-all duration-200 ease-in-out",
    `pl-[${SIDEBAR_COLLAPSED_WIDTH_PX}px] group-hover/chatlayout-main:pl-[${SIDEBAR_EXPANDED_WIDTH_PX}px]`
  );

  return (
    <SidebarProvider defaultOpen={true}> 
      <div className="group/chatlayout-main flex h-screen w-full bg-background">
        <Sidebar
          variant="sidebar" 
          collapsible="none" 
          className="border-r" 
        >
          <AppSidebarContent />
        </Sidebar>
        <main className={mainContentClasses}>
          <div className="fixed inset-0 z-0 pointer-events-none">
            <Particles
              className="h-full w-full"
              particleCount={250}
              particleSpread={8}
              speed={0.05}
              particleColors={[mounted && particleColor ? particleColor : "#ffffff"]}
              moveParticlesOnHover={true}
              particleHoverFactor={0.5}
              alphaParticles={true}
              particleBaseSize={80}
              sizeRandomness={0.5}
              cameraDistance={25}
              disableRotation={false}
            />

          </div>
          <div className="relative z-10 h-full w-full"> 
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
