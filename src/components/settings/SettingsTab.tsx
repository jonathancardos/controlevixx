"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes"; // Import useTheme hook

export function SettingsTab() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <Card className="vixxe-shadow rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-bold">
            <Settings className="w-5 h-5" />
            Configurações do Sistema
          </CardTitle>
          <CardDescription>
            Gerencie as configurações gerais da aplicação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Selector */}
          <div className="space-y-2">
            <Label htmlFor="theme-select" className="flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              Tema da Interface
            </Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger id="theme-select" className="w-[180px]">
                <SelectValue placeholder="Selecionar Tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="dark">Escuro</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Other settings can go here */}
          <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
            <p>Outras configurações serão adicionadas aqui em breve.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}