"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Home, ShoppingCart, Bot, TrendingUp, BarChart3, Users, Star, Package, DollarSign, Settings, Menu, X, UserCircle } from "lucide-react";
import { TabId } from "@/types/dashboard";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  allowedTabs: TabId[];
  userRole: 'master' | 'admin' | 'gestor' | 'funcionario';
  userName: string;
  onLogout: () => void;
}

const allTabs: Array<{ id: TabId; label: string; icon: React.ElementType; roles: string[] }> = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['master', 'admin', 'gestor', 'funcionario'] },
  { id: 'pdv', label: 'PDV', icon: ShoppingCart, roles: ['master', 'admin', 'gestor', 'funcionario'] },
  { id: 'chat-generator', label: 'Chat Comanda', icon: Bot, roles: ['master', 'admin', 'gestor', 'funcionario'] },
  { id: 'sales', label: 'Vendas', icon: TrendingUp, roles: ['master', 'admin', 'gestor'] },
  { id: 'insights', label: 'Insights', icon: BarChart3, roles: ['master', 'admin', 'gestor'] },
  { id: 'users', label: 'Usuários', icon: Users, roles: ['master', 'admin'] },
  { id: 'clients', label: 'Clientes', icon: Star, roles: ['master', 'admin', 'gestor'] },
  { id: 'inventory', label: 'Insumos', icon: Package, roles: ['master', 'funcionario'] },
  { id: 'financial', label: 'Financeiro', icon: DollarSign, roles: ['master', 'funcionario'] },
  { id: 'settings', label: 'Configurações', icon: Settings, roles: ['master', 'funcionario'] },
];

export function Sidebar({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  allowedTabs,
  userRole,
  userName,
  onLogout,
}: SidebarProps) {
  const isMobile = useIsMobile();

  const filteredTabs = allTabs.filter(tab => allowedTabs.includes(tab.id));

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-lg">
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <h2 className="text-2xl font-bold vixxe-gradient bg-clip-text text-transparent">Vixxe Maria</h2>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="grid items-start gap-2 px-4">
          {filteredTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "sidebar-active" : "sidebar-ghost"}
                onClick={() => {
                  onTabChange(tab.id);
                  if (isMobile) onClose();
                }}
                className="justify-start"
              >
                <Icon className="mr-3 h-5 w-5" />
                {tab.label}
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="mt-auto p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
              {userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-sidebar-foreground/80 capitalize">{userRole}</p>
          </div>
        </div>
        <Button variant="sidebar-ghost" onClick={onLogout} className="w-full justify-start text-destructive hover:text-destructive">
          <LogOut className="mr-3 h-5 w-5" />
          Sair
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="p-0 w-64">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className={cn("h-full", isOpen ? "w-64" : "w-0 hidden")}>
      {sidebarContent}
    </div>
  );
}