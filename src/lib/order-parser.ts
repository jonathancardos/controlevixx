import { ExtractedOrder, OrderItem } from '@/types/dashboard';

export function parseCurrency(str: string | null): number | null {
  if (!str) return null;
  
  // Remove non-numeric characters except commas and dots
  const cleaned = String(str).trim().replace(/[^0-9\.,]/g, '');
  
  if (cleaned.indexOf(',') > -1 && cleaned.indexOf('.') > -1) {
    // Brazilian format: 1.234,56 -> remove dots, replace comma with dot
    const formatted = cleaned.replace(/\./g, '').replace(',', '.');
    const value = parseFloat(formatted);
    return isNaN(value) ? null : value;
  }
  
  const formatted = cleaned.replace(',', '.');
  const value = parseFloat(formatted);
  return isNaN(value) ? null : value;
}

export function formatCurrency(num: number | null): string {
  if (num == null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(num);
}

export function extractFromText(text: string): ExtractedOrder {
  const result: ExtractedOrder = {
    client: null,
    date: null,
    total: null,
    paymentMethod: null,
    items: [],
    raw: text
  };

  if (!text) return result;

  // Normalize lines
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Date detection: dd/mm/yyyy or dd-mm-yyyy
  for (const line of lines) {
    const dateMatch = line.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{2,4})/);
    if (dateMatch) {
      result.date = dateMatch[1];
      break;
    }
  }

  // Client detection: "Cliente:" or "Cliente -"
  for (const line of lines) {
    const clientMatch = line.match(/cliente[:\-]\s*(.+)/i);
    if (clientMatch) {
      result.client = clientMatch[1].trim();
      break;
    }
  }

  // Fallback client detection
  if (!result.client) {
    for (const line of lines) {
      const fallbackMatch = line.match(/^cliente\s+(.+)/i);
      if (fallbackMatch) {
        result.client = fallbackMatch[1].trim();
        break;
      }
    }
  }

  // Items detection: lines with quantity and price
  const itemRegex = /(?:^|\s)(\d+)x?\s*([^\-–—\|]+?)[\-\—–\|]\s*R\$?\s*([\d\.,]+)/i;
  for (const line of lines) {
    const itemMatch = line.match(itemRegex);
    if (itemMatch) {
      const qty = parseInt(itemMatch[1], 10);
      const name = itemMatch[2].trim();
      const price = parseCurrency(itemMatch[3]);
      result.items.push({ qty, name, price });
    }
  }

  // Simple item detection if no complex items found
  if (result.items.length === 0) {
    for (const line of lines) {
      const simpleMatch = line.match(/(?:•|-)\s*(.+?)\s+R\$?\s*([\d\.,]+)/);
      if (simpleMatch) {
        const name = simpleMatch[1].trim();
        const price = parseCurrency(simpleMatch[2]);
        result.items.push({ qty: 1, name, price });
      }
    }
  }

  // Total detection
  const reversedLines = [...lines].reverse();
  for (const line of reversedLines) {
    const totalMatch = line.match(/total[:\-]?\s*R\$?\s*([\d\.,]+)/i) || 
                      line.match(/R\$?\s*([\d\.,]+)\s*$/);
    if (totalMatch) {
      const value = parseCurrency(totalMatch[1]);
      if (value != null) {
        result.total = value;
        break;
      }
    }
  }

  // Calculate total from items if not found
  if (result.total == null && result.items.length > 0) {
    let sum = 0;
    for (const item of result.items) {
      sum += (item.price || 0) * (item.qty || 1);
    }

    // Look for fees
    for (const line of lines) {
      const feeMatch = line.match(/taxa.*R\$?\s*([\d\.,]+)/i);
      if (feeMatch) {
        sum += parseCurrency(feeMatch[1]) || 0;
      }
    }

    result.total = Number(sum.toFixed(2));
  }

  // Final fallback: last currency value in text
  if (result.total == null) {
    const allCurrencies: string[] = [];
    for (const line of lines) {
      const matches = [...line.matchAll(/R\$?\s*([\d\.,]+)/g)];
      matches.forEach(match => allCurrencies.push(match[1]));
    }
    if (allCurrencies.length) {
      result.total = parseCurrency(allCurrencies[allCurrencies.length - 1]);
    }
  }

  // Clean up client name
  if (result.client) {
    result.client = result.client.replace(/[^A-Za-zÀ-ÿ0-9\s]/g, '').trim();
  }

  // Payment method detection
  const paymentKeywords = {
    'pix': /\b(pix)\b/i,
    'cartão': /\b(cart[aã]o|card|debito|credito)\b/i,
    'dinheiro': /\b(dinheiro|cash|especie|esp[eé]cie)\b/i,
    'transferência': /\b(transfer[eê]ncia|ted|doc)\b/i,
    'vale': /\b(vale|ticket|voucher)\b/i
  };

  for (const [method, regex] of Object.entries(paymentKeywords)) {
    if (regex.test(text)) {
      result.paymentMethod = method;
      break;
    }
  }

  return result;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}