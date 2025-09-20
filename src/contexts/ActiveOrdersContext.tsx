import React, { createContext, useContext, useState, useCallback } from 'react';
import { ChatExtractedOrder, ServiceType } from '@/types/dashboard'; // Importar ChatExtractedOrder e ServiceType
import { Cliente } from '@/types/supabase';

// Definir o tipo para os dados transferidos
interface TransferredOrderData {
  client: string;
  orderNumber: string;
  date: string;
  serviceType: ServiceType;
  address?: string;
  reference?: string;
  items: Array<{
    productId: string; // ID temporário para itens do chat
    name: string;
    price: number;
    quantity: number;
    observation?: string;
    adicionais?: { name: string; price: number | null }[]; // Adicionais
  }>;
  deliveryFee?: number;
  total: number;
  paymentMethod: 'Pix' | 'Dinheiro' | 'Cartão' | 'Outros';
  amountReceived?: number;
  changeAmount?: number;
  prepTimeMin: number;
  prepTimeMax: number;
  observations?: string;
}

interface ActiveOrdersContextType {
  transferExtractedData: (data: TransferredOrderData, selectedClient?: Cliente) => void;
  registerTransferHandler: (handler: (data: TransferredOrderData, selectedClient?: Cliente) => void) => void;
}

const ActiveOrdersContext = createContext<ActiveOrdersContextType | undefined>(undefined);

export function ActiveOrdersProvider({ children }: { children: React.ReactNode }) {
  const [transferHandler, setTransferHandler] = useState<((data: TransferredOrderData, selectedClient?: Cliente) => void) | null>(null);

  const transferExtractedData = useCallback((data: TransferredOrderData, selectedClient?: Cliente) => {
    if (transferHandler) {
      transferHandler(data, selectedClient);
    }
  }, [transferHandler]);

  const registerTransferHandler = useCallback((handler: (data: TransferredOrderData, selectedClient?: Cliente) => void) => {
    setTransferHandler(() => handler);
  }, []);

  return (
    <ActiveOrdersContext.Provider value={{
      transferExtractedData,
      registerTransferHandler
    }}>
      {children}
    </ActiveOrdersContext.Provider>
  );
}

export function useActiveOrders() {
  const context = useContext(ActiveOrdersContext);
  if (context === undefined) {
    throw new Error('useActiveOrders must be used within an ActiveOrdersProvider');
  }
  return context;
}