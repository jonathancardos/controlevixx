export interface OrderItem {
  qty: number;
  name: string;
  price: number | null;
  category?: string; // Adicionado para consistência com o PDV
  observation?: string; // Novo campo para observação do item
  adicionais?: { name: string; price: number | null }[]; // Novo campo para adicionais
}

export type ServiceType = 'consumo_local' | 'retirada' | 'entrega'; // Novo tipo para serviço

export interface ExtractedOrder {
  client: string | null;
  date: string | null;
  total: number | null;
  paymentMethod: string | null;
  items: OrderItem[];
  raw: string;
}

// Novo tipo para a saída da Gemini API
export interface ChatExtractedOrder {
  client: string;
  orderNumber: string; // Novo campo
  date: string; // Data agora é obrigatória
  serviceType: ServiceType; // Novo campo
  address?: string; // Novo campo, opcional
  reference?: string; // Novo campo, opcional
  items: OrderItem[];
  deliveryFee?: number; // Novo campo, opcional
  total: number;
  paymentMethod: 'Pix' | 'Dinheiro' | 'Cartão' | 'Outros';
  amountReceived?: number; // Novo campo, para troco
  changeAmount?: number; // Novo campo, para troco
  prepTimeMin: number; // Novo campo
  prepTimeMax: number; // Novo campo
  observations?: string;
}

export interface SavedOrder {
  id: string;
  client: string;
  date: string;
  total: number;
  paymentMethod: string;
  items: OrderItem[];
  raw: string;
  status: string;
  createdAt: Date;
}

export interface SalesCategory {
  key: string;
  label: string;
  max: number;
  value: number;
}

export interface ChartData {
  date: string;
  total: number;
}

export interface ClientData {
  name: string;
  total: number;
}

export type TabId = 
  | 'dashboard'
  | 'inventory'
  | 'chat-generator' // Nova aba
  | 'financial'
  | 'settings'
  | 'sales'
  | 'insights'
  | 'history'
  | 'users'
  | 'clients'
  | 'pdv';