export interface ChatExtractedOrder {
  client: string;
  orderNumber: string;
  date: string;
  serviceType: ServiceType;
  address?: string;
  reference?: string;
  items: OrderItem[];
  deliveryFee?: number;
  total: number;
  paymentMethod: 'Pix' | 'Dinheiro' | 'Cartão' | 'Outros';
  amountReceived?: number;
  changeAmount?: number;
  prepTimeMin: number;
  prepTimeMax: number;
  observations?: string;
  raw?: string; // Added
}