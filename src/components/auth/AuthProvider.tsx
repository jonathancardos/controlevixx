import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario } from '@/types/supabase';

interface AuthContextType {
  usuario: Usuario | null;
  login: (userData: Usuario) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  // Carregar usuário do localStorage na inicialização
  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('vixxe_usuario');
    if (usuarioSalvo) {
      try {
        setUsuario(JSON.parse(usuarioSalvo));
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        localStorage.removeItem('vixxe_usuario');
      }
    }
  }, []);

  const login = (userData: Usuario) => {
    setUsuario(userData);
    localStorage.setItem('vixxe_usuario', JSON.stringify(userData));
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('vixxe_usuario');
  };

  const isAuthenticated = !!usuario;

  return (
    <AuthContext.Provider value={{ usuario, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}