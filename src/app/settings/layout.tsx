import { ReactNode } from 'react';
import { SidebarNav } from '../../components/settings/SidebarNav';

interface SettingsLayoutProps {
  children: ReactNode;
}

const sidebarNavItems = [
  {
    title: "Security",
    href: "/settings",
  },
];

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className="flex-1 lg:max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
