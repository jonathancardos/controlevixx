import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import { AuthPage } from "@/components/auth/AuthPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { PublicOrderView } from "./pages/PublicOrderView";
import { ThemeProvider } from "@/components/theme/ThemeProvider"; // New import
import { ActiveOrdersProvider } from "@/contexts/ActiveOrdersContext";

const queryClient = new QueryClient();

function AppContent() {
  const { isAuthenticated, usuario, logout, login } = useAuth(); // <-- 'login' desestruturado aqui

  if (!isAuthenticated || !usuario) {
    return <AuthPage onLogin={login} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index user={usuario} onLogout={logout} />} />
        <Route path="/public-order/:id" element={<PublicOrderView />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vixxe-theme"> {/* Add ThemeProvider */}
          <ActiveOrdersProvider>
            <AppContent />
          </ActiveOrdersProvider>
        </ThemeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;