"use client";

import React, { useState, useEffect } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "react-resizable-panels";
import { Sidebar } from './Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { TabId } from '@/types/dashboard';
import { useIsMobile } from '@/hooks/use-mobile';
import { Usuario } from '@/types/supabase';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  user: Usuario;
  onLogout: () => void;
}

export function Layout({ children, user, onLogout }: LayoutProps) {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  // Abas permitidas para o papel do usuário
  const allowedTabs: TabId[] = (() => {
    switch (user.role) {
      case 'master':
        return ['dashboard', 'pdv', 'chat-generator', 'sales', 'insights', 'users', 'clients', 'inventory', 'financial', 'settings'];
      case 'admin':
        return ['dashboard', 'pdv', 'chat-generator', 'sales', 'insights', 'users', 'clients'];
      case 'gestor':
        return ['dashboard', 'pdv', 'chat-generator', 'sales', 'insights', 'clients'];
      case 'funcionario':
        return ['dashboard', 'pdv', 'chat-generator', 'inventory', 'financial', 'settings'];
      default:
        return ['dashboard'];
    }
  })();

  // Redireciona para o dashboard se a aba ativa não for permitida
  useEffect(() => {
    if (!allowedTabs.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [activeTab, allowedTabs]);

  // Control sidebar visibility based on mobile state
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [isMobile]);

  const handleTabChange = (tab: TabId) => {
    if (allowedTabs.includes(tab)) {
      setActiveTab(tab);
    } else {
      // Fallback to dashboard if somehow an unauthorized tab is selected
      setActiveTab('dashboard');
    }
  };

  const mainContent = (
    <div className="flex flex-col flex-1 h-full">
      <DashboardHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onExportCSV={() => { /* Export CSV logic will be handled by specific tabs */ }}
        allowedTabs={allowedTabs}
        userRole={user.role as 'master' | 'admin' | 'gestor' | 'funcionario'}
        userName={user.nome_usuario}
        onLogout={onLogout}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} // Pass toggle function
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {children(activeTab)} {/* Pass activeTab to children */}
      </main>
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          allowedTabs={allowedTabs}
          userRole={user.role}
          userName={user.nome_usuario}
          onLogout={onLogout}
        />
        <div className="flex-1 flex flex-col">
          {mainContent}
        </div>
      </div>
    );
  }

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="min-h-screen w-full border-none"
    >
      <ResizablePanel
        defaultSize={15}
        minSize={10}
        maxSize={20}
        collapsible={true}
        collapsedSize={0}
        onCollapse={() => setIsSidebarOpen(false)}
        onExpand={() => setIsSidebarOpen(true)}
        className={cn("min-w-[200px]", !isSidebarOpen && "hidden")}
      >
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)} // Not directly used in desktop, but kept for consistency
          activeTab={activeTab}
          onTabChange={handleTabChange}
          allowedTabs={allowedTabs}
          userRole={user.role}
          userName={user.nome_usuario}
          onLogout={onLogout}
        />
      </ResizablePanel>
      <ResizableHandle withHandle className="bg-border hover:bg-primary/50 transition-colors" />
      <ResizablePanel defaultSize={85}>
        {mainContent}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}