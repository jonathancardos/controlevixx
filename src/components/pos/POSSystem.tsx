const newOrder: ActiveOrder = {
  id: newId,
  cliente_nome: 'Novo Pedido',
  orderNumber: generateOrderId('VM'),
  date: format(new Date(), 'yyyy-MM-dd'),
  serviceType: 'consumo_local', // Fixed
  items: [],
  total: 0,
  createdAt: new Date(),
  forma_pagamento: 'Dinheiro',
  tipo_servico: 'local', // Keep as-is (matches supabase type)
  vipComboApplied: false,
  prepTimeMin: 30,
  prepTimeMax: 60,
};