import { supabase } from '@/integrations/supabase/client';
import { OrderItem } from '@/types/dashboard';
import type { Database } from '@/integrations/supabase/types';

type DatabaseOrder = Database['public']['Tables']['orders']['Row'];
type DatabaseOrderInsert = Database['public']['Tables']['orders']['Insert'];
type DatabaseOrderUpdate = Database['public']['Tables']['orders']['Update'];

export interface DatabaseSalesCategory {
  id: string;
  category_key: string;
  label: string;
  max_value: number;
  current_value: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseClient {
  id: string;
  name: string;
  phone?: string;
  total_spent: number;
  last_order_date?: string;
  order_count: number;
  created_at: string;
  updated_at: string;
}

// Converter SavedOrder para formato do banco
export function convertSavedOrderToDatabase(order: any): DatabaseOrderInsert {
  return {
    client_name: order.client || 'Cliente não informado',
    order_date: order.date || new Date().toISOString().split('T')[0],
    total_amount: order.total || 0,
    payment_method: order.paymentMethod || 'Não informado',
    items: order.items || [],
    raw_text: order.raw || '',
    status: order.status || 'completed'
  };
}

// Converter do banco para SavedOrder
export function convertDatabaseToSavedOrder(dbOrder: DatabaseOrder): any {
  return {
    id: dbOrder.id,
    client: dbOrder.client_name,
    date: dbOrder.order_date,
    total: dbOrder.total_amount,
    paymentMethod: dbOrder.payment_method,
    items: (dbOrder.items as unknown) as OrderItem[],
    raw: dbOrder.raw_text || '',
    status: dbOrder.status,
    createdAt: new Date(dbOrder.created_at)
  };
}

// Funções para comandas/pedidos
export async function saveOrderToDatabase(order: any): Promise<{ success: boolean; error?: string }> {
  try {
    const dbOrder = convertSavedOrderToDatabase(order);
    const { error } = await supabase
      .from('orders')
      .insert([dbOrder]);

    if (error) {
      console.error('Erro ao salvar pedido:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    console.error('Erro ao salvar pedido:', e);
    return { success: false, error: 'Erro interno' };
  }
}

export async function loadOrdersFromDatabase(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar pedidos:', error);
      return [];
    }

    return data.map(convertDatabaseToSavedOrder);
  } catch (e) {
    console.error('Erro ao carregar pedidos:', e);
    return [];
  }
}

export async function deleteOrderFromDatabase(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.error('Erro ao deletar pedido:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    console.error('Erro ao deletar pedido:', e);
    return { success: false, error: 'Erro interno' };
  }
}

export async function updateOrderInDatabase(orderId: string, updates: DatabaseOrderUpdate): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId);

    if (error) {
      console.error('Erro ao atualizar pedido:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    console.error('Erro ao atualizar pedido:', e);
    return { success: false, error: 'Erro interno' };
  }
}

// Funções para categorias
export async function loadCategoriesFromDatabase(): Promise<DatabaseSalesCategory[]> {
  try {
    const { data, error } = await supabase
      .from('sales_categories')
      .select('*')
      .order('category_key');

    if (error) {
      console.error('Erro ao carregar categorias:', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('Erro ao carregar categorias:', e);
    return [];
  }
}

export async function updateCategoryInDatabase(categoryKey: string, updates: { current_value: number }): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('sales_categories')
      .update(updates)
      .eq('category_key', categoryKey);

    if (error) {
      console.error('Erro ao atualizar categoria:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    console.error('Erro ao atualizar categoria:', e);
    return { success: false, error: 'Erro interno' };
  }
}

// Funções para clientes
export async function loadClientsFromDatabase(): Promise<DatabaseClient[]> {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('total_gasto', { ascending: false });

    if (error) {
      console.error('Erro ao carregar clientes:', error);
      return [];
    }

    // Convert clientes to DatabaseClient format
    const clients: DatabaseClient[] = (data || []).map(cliente => ({
      id: cliente.id,
      name: cliente.nome,
      phone: cliente.telefone || undefined,
      total_spent: Number(cliente.total_gasto || 0),
      last_order_date: cliente.ultimo_pedido ? new Date(cliente.ultimo_pedido).toISOString().split('T')[0] : undefined,
      order_count: cliente.total_pedidos || 0,
      created_at: cliente.created_at || new Date().toISOString(),
      updated_at: cliente.updated_at || new Date().toISOString()
    }));

    return clients;
  } catch (e) {
    console.error('Erro ao carregar clientes:', e);
    return [];
  }
}

// Função para obter relatórios de vendas
export async function getSalesReport(startDate?: string, endDate?: string) {
  try {
    let query = supabase.from('orders').select('*');
    
    if (startDate) {
      query = query.gte('order_date', startDate);
    }
    
    if (endDate) {
      query = query.lte('order_date', endDate);
    }

    const { data, error } = await query.order('order_date', { ascending: false });

    if (error) {
      console.error('Erro ao obter relatório:', error);
      return { orders: [], totalSales: 0, averageTicket: 0, totalOrders: 0 };
    }

    const orders = data || [];
    const totalSales = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const totalOrders = orders.length;
    const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

    return { orders, totalSales, averageTicket, totalOrders };
  } catch (e) {
    console.error('Erro ao obter relatório:', e);
    return { orders: [], totalSales: 0, averageTicket: 0, totalOrders: 0 };
  }
}

// Função para migrar dados do localStorage para Supabase
export async function migrateLocalStorageToSupabase(): Promise<{ success: boolean; migrated: number; error?: string }> {
  try {
    // Carregar dados do localStorage
    const historyKey = 'vixxe_history_v1';
    const localData = localStorage.getItem(historyKey);
    
    if (!localData) {
      return { success: true, migrated: 0 };
    }

    const orders = JSON.parse(localData);
    let migrated = 0;

    for (const order of orders) {
      const result = await saveOrderToDatabase(order);
      if (result.success) {
        migrated++;
      }
    }

    // Limpar localStorage após migração bem-sucedida
    if (migrated > 0) {
      localStorage.removeItem(historyKey);
      localStorage.removeItem('vixxe_categories_v1'); // Remover categorias também
    }

    return { success: true, migrated };
  } catch (e) {
    console.error('Erro na migração:', e);
    return { success: false, migrated: 0, error: 'Erro na migração' };
  }
}

// Função para exportar dados para CSV
export async function exportOrdersToCSV(startDate?: string, endDate?: string): Promise<void> {
  try {
    const { orders } = await getSalesReport(startDate, endDate);
    
    if (!orders.length) {
      alert('Nenhum registro para exportar');
      return;
    }

    const header = ['ID', 'Cliente', 'Data', 'Total', 'Forma de Pagamento', 'Status'];
    const rows = orders.map(order => [
      order.id,
      `"${order.client_name.replace(/"/g, '""')}"`,
      order.order_date,
      order.total_amount.toString(),
      order.payment_method,
      order.status
    ]);

    const csvContent = [header, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vixxe_relatorio_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Erro ao exportar CSV:', e);
    alert('Erro ao exportar dados');
  }
}