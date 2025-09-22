"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, Loader2, MessageSquare, CheckCircle, AlertTriangle, DollarSign, Calendar, CreditCard, Package, Tag, Truck, Clock, MapPin, Save, Upload, XCircle, History as HistoryIcon, Settings, Plus, Edit, Trash2, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { useActiveOrders } from '@/contexts/ActiveOrdersContext';
import { ChatExtractedOrder, OrderItem, ServiceType } from '@/types/dashboard';
import { formatCurrency } from '@/lib/order-parser';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { getPaymentMethodClass } from '@/components/dashboard/PaymentMethodFilter';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneratedComandasList } from './GeneratedComandasList';
import { EditComandaSheet } from '@/components/modals/EditComandaSheet';
import { Comanda, ComandaInsert, ComandaTemplate as ComandaTemplateType } from '@/types/supabase'; // Importar ComandaInsert e ComandaTemplateType
import { useComandas } from '@/hooks/useSupabase'; // Importar useComandas
import { useAuth } from '@/components/auth/AuthProvider'; // Importar useAuth
import { useComandaTemplates } from '@/hooks/useComandaTemplates'; // Importar useComandaTemplates
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ComandaTemplate } from './ComandaTemplate'; // Importar ComandaTemplate

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

const LOCAL_STORAGE_CHAT_KEY = 'vixxe_comanda_chat_history';
const LOCAL_STORAGE_EXTRACTED_ORDER_KEY = 'vixxe_comanda_extracted_order';

export function ComandaChatGenerator() {
  const { transferExtractedData } = useActiveOrders();
  const { salvarComanda, loading: savingComanda } = useComandas();
  const { usuario } = useAuth(); // Obter o usuário logado
  const { templates, activeDailyTemplate, loading: templatesLoading, loadTemplates, createTemplate, updateTemplate, deleteTemplate, setComandaDailyTemplate } = useComandaTemplates();

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedOrder, setExtractedOrder] = useState<ChatExtractedOrder | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState('chat-ia');
  const [selectedComandaForView, setSelectedComandaForView] = useState<Comanda | null>(null);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);

  // Estados para o formulário de criação/edição de template
  const [newTemplateForm, setNewTemplateForm] = useState({
    name: '',
    content: '',
  });
  const [editingTemplate, setEditingTemplate] = useState<ComandaTemplateType | null>(null);

  const genAI = useRef<GoogleGenerativeAI | null>(null);
  const model = useRef<GenerativeModel | null>(null);

  useEffect(() => {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    console.log("Valor da VITE_GEMINI_API_KEY:", API_KEY);
    if (!API_KEY) {
      toast.error("Chave da API Gemini não configurada. Verifique a variável de ambiente VITE_GEMINI_API_KEY.");
      return;
    }
    genAI.current = new GoogleGenerativeAI(API_KEY, { apiVersion: 'v1' });
    model.current = genAI.current.getGenerativeModel({ 
      model: "gemini-2.5-flash",
    });
  }, []);

  // Load chat and templates from localStorage/Supabase on mount
  useEffect(() => {
    if (usuario?.id) {
      loadTemplates(usuario.id);
    }

    try {
      const savedChat = localStorage.getItem(LOCAL_STORAGE_CHAT_KEY);
      const savedOrder = localStorage.getItem(LOCAL_STORAGE_EXTRACTED_ORDER_KEY);

      if (savedChat) {
        const parsedChat: ChatMessage[] = JSON.parse(savedChat).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setChatMessages(parsedChat);
        toast.info("Chat anterior carregado!");
      }
      if (savedOrder) {
        setExtractedOrder(JSON.parse(savedOrder));
      }
    } catch (e) {
      console.error("Failed to load chat from localStorage", e);
      toast.error("Erro ao carregar chat salvo. Iniciando um novo chat.");
      localStorage.removeItem(LOCAL_STORAGE_CHAT_KEY);
      localStorage.removeItem(LOCAL_STORAGE_EXTRACTED_ORDER_KEY);
    }
  }, [usuario?.id, loadTemplates]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const parseGeminiResponse = (text: string): ChatExtractedOrder | null => {
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        // Basic validation for new required fields
        if (parsed.client && parsed.orderNumber && parsed.date && parsed.serviceType && parsed.items && Array.isArray(parsed.items) && parsed.total != null && parsed.paymentMethod && parsed.prepTimeMin != null && parsed.prepTimeMax != null) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to parse Gemini JSON response:", e);
    }
    return null;
  };

  const generatePrompt = (history: ChatMessage[], currentInput: string): string => {
    const chatHistory = history
      .map(msg => `${msg.sender === 'user' ? 'Cliente' : 'Atendente'}: ${msg.text}`)
      .join('\n');

    return `Você é um assistente de restaurante Vixxe Maria. Seu objetivo é coletar informações do cliente para montar uma comanda.
    Mantenha a conversa natural e amigável.
    Quando tiver informações suficientes para montar uma comanda (nome do cliente, pelo menos um item, forma de pagamento, tipo de serviço e tempo de preparo),
    você deve responder com a comanda formatada em JSON, além de uma mensagem amigável.
    
    O JSON deve ter a seguinte estrutura EXATA:
    \`\`\`json
    {
      "client": "Nome do Cliente",
      "orderNumber": "VM000", // Gerar um número de comanda único no formato VMXXX, onde XXX é um número sequencial ou aleatório de 3 dígitos.
      "date": "YYYY-MM-DD", // Data atual no formato YYYY-MM-DD
      "serviceType": "consumo_local" | "retirada" | "entrega", // Tipo de serviço: 'consumo_local', 'retirada' ou 'entrega'
      "address": "Endereço completo", // Opcional, apenas se serviceType for 'entrega'
      "reference": "Ponto de referência", // Opcional, apenas se serviceType for 'entrega'
      "items": [
        { 
          "name": "Nome do Item Principal", 
          "qty": 1, 
          "price": 25.00, 
          "observation": "Observação do item (ex: sem cebola)", // Opcional
          "adicionais": [ // Opcional, lista de adicionais para este item
            { "name": "Nome do Adicional", "price": 2.00 }
          ]
        }
      ],
      "deliveryFee": 0.00, // Opcional, apenas se serviceType for 'entrega' e houver menção de taxa. Se não for mencionado, use 0.00.
      "total": 0.00, // Soma de todos os itens (incluindo adicionais) e taxa de entrega
      "paymentMethod": "Pix" | "Dinheiro" | "Cartão" | "Outros",
      "amountReceived": 0.00, // Opcional, se o pagamento for em dinheiro e o cliente informar o valor para troco
      "changeAmount": 0.00, // Opcional, se o pagamento for em dinheiro e houver troco (amountReceived - total)
      "prepTimeMin": 30, // Tempo mínimo de preparo em minutos (padrão 30)
      "prepTimeMax": 60, // Tempo máximo de preparo em minutos (padrão 60)
      "observations": "Observações gerais do pedido" // Opcional
    }
    \`\`\`
    
    Regras para preenchimento do JSON:
    - \`orderNumber\`: Sempre gere um ID único no formato "VM" seguido de 3 dígitos (ex: VM001, VM123).
    - \`date\`: Use a data atual no formato "YYYY-MM-DD".
    - \`serviceType\`: Determine com base na conversa se é "consumo_local", "retirada" ou "entrega".
    - \`address\` e \`reference\`: Preencha apenas se \`serviceType\` for "entrega" e o cliente fornecer essas informações.
    - \`items\`: Cada item principal deve ter \`name\`, \`qty\`, \`price\`. \`observation\` é opcional. \`adicionais\` é uma lista opcional de objetos \`{ "name": "...", "price": ... }\`.
    - \`deliveryFee\`: Preencha apenas se \`serviceType\` for "entrega" e houver menção de taxa. Se não for mencionado, use 0.00.
    - \`total\`: Calcule a soma de \`items\` (incluindo adicionais) e \`deliveryFee\`.
    - \`paymentMethod\`: Determine com base na conversa.
    - \`amountReceived\` e \`changeAmount\`: Preencha apenas se \`paymentMethod\` for "Dinheiro" e o cliente especificar o valor para troco. Calcule \`changeAmount\` como \`amountReceived - total\`.
    - \`prepTimeMin\` e \`prepTimeMax\`: Use valores padrão de 30 e 60 minutos, a menos que o cliente especifique.
    - \`observations\`: Observações gerais do pedido, se houver.

    Se não tiver informações suficientes, continue a conversa.
    Se o cliente pedir um combo VIP, o preço do combo é R$27,00.

    Histórico da conversa:
    ${chatHistory}
    Cliente: ${currentInput}
    Atendente:`;
  };

  const createComandaInsertObject = (status: 'Pendente' | 'Processada'): ComandaInsert | null => {
    if (!extractedOrder) return null;

    return {
      cliente_nome: extractedOrder.client || 'Cliente da Comanda',
      valor: extractedOrder.total || 0,
      forma_pagamento: extractedOrder.paymentMethod || 'Outros',
      data: extractedOrder.date || format(new Date(), 'yyyy-MM-dd'),
      horario: format(new Date(), 'HH:mm:ss'),
      items: extractedOrder.items.map(item => ({
        qty: item.qty,
        name: item.name,
        price: item.price || 0,
        observation: item.observation || undefined,
        adicionais: item.adicionais || undefined,
      })),
      observacoes: extractedOrder.observations,
      status: status,
      tipo_servico: extractedOrder.serviceType === 'consumo_local' ? 'local' : extractedOrder.serviceType === 'retirada' ? 'retirada' : 'entrega',
      status_pagamento: 'Pendente',
      status_entrega: extractedOrder.serviceType === 'entrega' ? 'Pendente' : null,
      texto_original: extractedOrder.raw,
      orderNumber: extractedOrder.orderNumber,
      address: extractedOrder.address,
      reference: extractedOrder.reference,
      deliveryFee: extractedOrder.deliveryFee,
      amountReceived: extractedOrder.amountReceived,
      changeAmount: extractedOrder.changeAmount,
      prepTimeMin: extractedOrder.prepTimeMin,
      prepTimeMax: extractedOrder.prepTimeMax,
    };
  };

  const handleFinalizeComanda = useCallback(async () => {
    const comandaData = createComandaInsertObject('Processada');
    if (!comandaData) {
      toast.error("Nenhuma comanda extraída para finalizar.");
      return;
    }

    const result = await salvarComanda(comandaData);
    if (result) {
      toast.success(`Comanda ${result.cliente_nome} finalizada e salva!`);
      setExtractedOrder(null);
      setChatMessages([]);
      localStorage.removeItem(LOCAL_STORAGE_CHAT_KEY);
      localStorage.removeItem(LOCAL_STORAGE_EXTRACTED_ORDER_KEY);
      setActiveTab('comandas-geradas');
    }
  }, [extractedOrder, salvarComanda, setActiveTab]);

  const handleSaveAsPending = useCallback(async () => {
    const comandaData = createComandaInsertObject('Pendente');
    if (!comandaData) {
      toast.error("Nenhuma comanda extraída para salvar.");
      return;
    }

    const result = await salvarComanda(comandaData);
    if (result) {
      toast.success(`Comanda ${result.cliente_nome} salva como pendente!`);
      // Do NOT clear extractedOrder or chatMessages, allow user to continue
      // Do NOT navigate away
    }
  }, [extractedOrder, salvarComanda]);

  const getMissingFields = () => {
    if (!extractedOrder) return [];
    const missing = [];
    if (!extractedOrder.client) missing.push('Cliente');
    if (!extractedOrder.items || extractedOrder.items.length === 0) missing.push('Itens');
    if (!extractedOrder.paymentMethod) missing.push('Pagamento');
    if (!extractedOrder.serviceType) missing.push('Tipo de Serviço');
    if (!extractedOrder.prepTimeMin || !extractedOrder.prepTimeMax) missing.push('Tempo de Preparo');
    return missing;
  };

  const missingFields = getMissingFields();

  const sendMessage = async () => {
    if (!userInput.trim() || !model.current) return;

    const newUserMessage: ChatMessage = { sender: 'user', text: userInput, timestamp: new Date() };
    setChatMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setLoading(true);

    try {
      const prompt = generatePrompt(chatMessages, newUserMessage.text);
      const result = await model.current.generateContent(prompt);
      const responseText = result.response.text();

      const parsedOrder = parseGeminiResponse(responseText);
      if (parsedOrder) {
        setExtractedOrder(parsedOrder);
        setChatMessages(prev => [...prev, { sender: 'bot', text: "Comanda extraída com sucesso! Por favor, revise os detalhes abaixo. Posso finalizar a comanda para você, ou gostaria de adicionar/modificar algo?", timestamp: new Date() }]);
        localStorage.setItem(LOCAL_STORAGE_EXTRACTED_ORDER_KEY, JSON.stringify(parsedOrder));
      } else {
        setChatMessages(prev => [...prev, { sender: 'bot', text: responseText, timestamp: new Date() }]);
      }
      localStorage.setItem(LOCAL_STORAGE_CHAT_KEY, JSON.stringify([...chatMessages, newUserMessage, { sender: 'bot', text: responseText, timestamp: new Date() }]));
    } catch (error) {
      console.error("Erro ao chamar a API Gemini:", error);
      toast.error("Erro ao processar a mensagem. Tente novamente.");
      setChatMessages(prev => [...prev, { sender: 'bot', text: "Desculpe, tive um problema ao processar sua solicitação. Poderia tentar novamente?", timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChat = () => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CHAT_KEY, JSON.stringify(chatMessages));
      if (extractedOrder) {
        localStorage.setItem(LOCAL_STORAGE_EXTRACTED_ORDER_KEY, JSON.stringify(extractedOrder));
      }
      toast.success("Chat salvo com sucesso!");
    } catch (e) {
      console.error("Erro ao salvar chat:", e);
      toast.error("Erro ao salvar chat.");
    }
  };

  const handleLoadChat = () => {
    try {
      const savedChat = localStorage.getItem(LOCAL_STORAGE_CHAT_KEY);
      const savedOrder = localStorage.getItem(LOCAL_STORAGE_EXTRACTED_ORDER_KEY);

      if (savedChat) {
        const parsedChat: ChatMessage[] = JSON.parse(savedChat).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setChatMessages(parsedChat);
        toast.success("Chat carregado com sucesso!");
      } else {
        toast.info("Nenhum chat salvo encontrado.");
      }
      if (savedOrder) {
        setExtractedOrder(JSON.parse(savedOrder));
      } else {
        setExtractedOrder(null);
      }
    } catch (e) {
      console.error("Erro ao carregar chat:", e);
      toast.error("Erro ao carregar chat.");
    }
  };

  const handleClearExtractedOrder = () => {
    setExtractedOrder(null);
    localStorage.removeItem(LOCAL_STORAGE_EXTRACTED_ORDER_KEY);
    toast.info("Comanda extraída limpa.");
  };

  const handleViewComanda = (comanda: Comanda) => {
    setSelectedComandaForView(comanda);
    setIsViewSheetOpen(true);
  };

  // Função dummy para onSave, pois a sheet de visualização não salva diretamente
  const handleSaveViewedComanda = () => {
    // Não faz nada, pois esta sheet é apenas para visualização
  };

  const handleCreateTemplate = async () => {
    if (!usuario?.id) {
      toast.error("Usuário não autenticado.");
      return;
    }
    if (!newTemplateForm.name.trim() || !newTemplateForm.content.trim()) {
      toast.error("Nome e conteúdo do modelo são obrigatórios.");
      return;
    }
    await createTemplate(usuario.id, newTemplateForm.name, newTemplateForm.content);
    setNewTemplateForm({ name: '', content: '' });
  };

  const handleEditTemplate = (template: ComandaTemplateType) => {
    setEditingTemplate(template);
    setNewTemplateForm({ name: template.template_name, content: template.template_content });
  };

  const handleUpdateTemplate = async () => {
    if (!usuario?.id || !editingTemplate) {
      toast.error("Nenhum modelo selecionado para edição.");
      return;
    }
    if (!newTemplateForm.name.trim() || !newTemplateForm.content.trim()) {
      toast.error("Nome e conteúdo do modelo são obrigatórios.");
      return;
    }
    await updateTemplate(editingTemplate.id, usuario.id, {
      template_name: newTemplateForm.name,
      template_content: newTemplateForm.content,
    });
    setEditingTemplate(null);
    setNewTemplateForm({ name: '', content: '' });
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!usuario?.id) {
      toast.error("Usuário não autenticado.");
      return;
    }
    await deleteTemplate(templateId, usuario.id);
  };

  const handleSetActiveDailyTemplate = async (templateId: string) => {
    if (!usuario?.id) {
      toast.error("Usuário não autenticado.");
      return;
    }
    await setComandaDailyTemplate(usuario.id, templateId);
  };

  const handleClearActiveDailyTemplate = async () => {
    if (!usuario?.id) {
      toast.error("Usuário não autenticado.");
      return;
    }
    await setComandaDailyTemplate(usuario.id, null);
  };

  return (
    <Card className="vixxe-shadow rounded-xl flex flex-col h-[calc(100vh-180px)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Gerador de Comandas (Chat AI)
        </CardTitle>
        <CardDescription>
          Converse com a IA para criar comandas e transferir para o PDV.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4 pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 rounded-xl p-1 shadow-inner">
            <TabsTrigger value="chat-ia" className="text-sm data-[state=active]:bg-vixxe-gradient data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-lg transition-all duration-200">
              <Bot className="w-4 h-4 mr-2" />
              Chat com IA
            </TabsTrigger>
            <TabsTrigger value="comandas-geradas" className="text-sm data-[state=active]:bg-vixxe-gradient data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-lg transition-all duration-200">
              <HistoryIcon className="w-4 h-4 mr-2" />
              Comandas Geradas
            </TabsTrigger>
            <TabsTrigger value="modelos" className="text-sm data-[state=active]:bg-vixxe-gradient data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-lg transition-all duration-200">
              <Settings className="w-4 h-4 mr-2" />
              Modelos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat-ia" className="flex-1 flex flex-col mt-0">
            <ScrollArea className="flex-1 border rounded-lg p-4 mb-4 bg-muted/20 max-h-[calc(100vh-300px)]">
              <div className="space-y-4" ref={chatContainerRef}>
                {chatMessages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <Bot className="w-12 h-12 mx-auto mb-3" />
                    <p>Olá! Como posso ajudar a montar sua comanda hoje?</p>
                  </div>
                )}
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender === 'bot' && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[70%] p-3 rounded-lg shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : 'bg-background text-foreground rounded-bl-none border'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <span className="text-xs text-muted-foreground block mt-1 text-right">
                        {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {msg.sender === 'user' && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-secondary text-secondary-foreground">VC</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex items-start gap-3 justify-start">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                    </Avatar>
                    <div className="max-w-[70%] p-3 rounded-lg shadow-sm bg-background text-foreground rounded-bl-none border">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {extractedOrder && (
              <Card className="mb-4 border-primary/20 bg-card/80 vixxe-shadow rounded-lg">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Comanda Extraída (Prévia)
                  </CardTitle>
                  {missingFields.length > 0 && (
                    <CardDescription className="text-sm text-yellow-500 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Campos pendentes: {missingFields.join(', ')}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{extractedOrder.client || 'Não informado'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">#{extractedOrder.orderNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{extractedOrder.date || format(new Date(), 'dd/MM/yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium capitalize">{extractedOrder.serviceType.replace('_', ' ')}</span>
                    </div>
                    {extractedOrder.address && (
                      <div className="flex items-center gap-2 col-span-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{extractedOrder.address}</span>
                      </div>
                    )}
                    {extractedOrder.reference && (
                      <div className="flex items-center gap-2 col-span-2">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Ref: {extractedOrder.reference}</span>
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4" /> Itens ({extractedOrder.items.length})
                    </h4>
                    <div className="space-y-1">
                      {extractedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex flex-col text-xs bg-muted/30 p-2 rounded-md">
                          <div className="flex justify-between">
                            <span>{item.qty}x {item.name}</span>
                            <span>{formatCurrency((item.price || 0) * item.qty)}</span>
                          </div>
                          {item.adicionais && item.adicionais.length > 0 && (
                            <ul className="ml-4 list-disc list-inside">
                              {item.adicionais.map((add, addIdx) => (
                                <li key={addIdx}>Adicional: {add.name} - {formatCurrency(add.price)}</li>
                              ))}
                            </ul>
                          )}
                          {item.observation && (
                            <span className="text-muted-foreground mt-1">Obs: {item.observation}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {extractedOrder.deliveryFee && extractedOrder.deliveryFee > 0 && (
                    <>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold flex items-center gap-2">
                          <Truck className="w-4 h-4" /> Taxa de Entrega
                        </span>
                        <span className="font-bold">{formatCurrency(extractedOrder.deliveryFee)}</span>
                      </div >
                    </>
                  )}
                  <Separator />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Total: {formatCurrency(extractedOrder.total || 0)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <Badge className={getPaymentMethodClass(extractedOrder.paymentMethod || 'Outros')}>
                        {extractedOrder.paymentMethod || 'Não informado'}
                      </Badge>
                    </div>
                    {extractedOrder.amountReceived && extractedOrder.changeAmount !== undefined && (
                      <>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Recebido: {formatCurrency(extractedOrder.amountReceived)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Troco: {formatCurrency(extractedOrder.changeAmount)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center gap-2 col-span-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Preparo: {extractedOrder.prepTimeMin}-{extractedOrder.prepTimeMax} min</span>
                    </div>
                  </div>
                  {extractedOrder.observations && (
                    <div>
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4" /> Observações Gerais
                      </h4>
                      <p className="text-xs bg-muted/30 p-2 rounded-md">{extractedOrder.observations}</p>
                    </div>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleFinalizeComanda} className="flex-1 bg-vixxe-gradient text-white hover:opacity-90" disabled={savingComanda}>
                      {savingComanda ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                      {savingComanda ? 'Finalizando...' : 'Finalizar Comanda'}
                    </Button>
                    <Button onClick={handleSaveAsPending} className="flex-1 bg-blue-600 text-white hover:bg-blue-700" disabled={savingComanda}>
                      {savingComanda ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      {savingComanda ? 'Salvando...' : 'Salvar como Pendente'}
                    </Button>
                    <Button variant="outline" onClick={handleClearExtractedOrder} className="flex-1 text-destructive hover:text-destructive">
                      <XCircle className="w-4 h-4 mr-2" />
                      Limpar Prévia
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 h-10 rounded-lg"
                disabled={loading}
              />
              <Button onClick={sendMessage} disabled={loading || !userInput.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
              <Button variant="outline" onClick={handleSaveChat} disabled={loading}>
                <Save className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={handleLoadChat} disabled={loading}>
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="comandas-geradas" className="flex-1 flex-col mt-0">
            <GeneratedComandasList onViewComanda={handleViewComanda} />
          </TabsContent>

          <TabsContent value="modelos" className="flex-1 flex-col mt-0 space-y-6">
            <Card className="vixxe-shadow rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  {editingTemplate ? 'Editar Modelo' : 'Criar Novo Modelo'}
                </CardTitle>
                <CardDescription>
                  Defina um modelo para suas comandas. Use placeholders como `{{cliente}}`, `{{total}}`, `{{items}}`.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Nome do Modelo</Label>
                  <Input
                    id="template-name"
                    value={newTemplateForm.name}
                    onChange={(e) => setNewTemplateForm({ ...newTemplateForm, name: e.target.value })}
                    placeholder="Ex: Modelo WhatsApp Padrão"
                  />
                </div>
                <div>
                  <Label htmlFor="template-content">Conteúdo do Modelo</Label>
                  <Textarea
                    id="template-content"
                    value={newTemplateForm.content}
                    onChange={(e) => setNewTemplateForm({ ...newTemplateForm, content: e.target.value })}
                    placeholder={`Ex:
════════════════════════════
🍔 **VIXXE MARIA – COMANDA**
════════════════════════════
📅 Data: **{{data}}**
🔖 COMANDA **#{{orderNumber}}**
👤 Cliente: **{{cliente}}**
{{serviceType}}
{{address}}
{{reference}}
════════════════════════════
🧾 **PEDIDOS:**
{{items}}

{{observacoes}}
════════════════════════════
{{deliveryFee}}
💰 **TOTAL: R$ {{total}}**
{{paymentMethod}}
{{paymentDetails}}
════════════════════════════
⏱ Tempo de preparo: {{prepTimeMin}} a {{prepTimeMax}} minutos
════════════════════════════`}
                    rows={15}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Placeholders disponíveis: `{{cliente}}`, `{{orderNumber}}`, `{{data}}`, `{{serviceType}}`, `{{address}}`, `{{reference}}`, `{{items}}`, `{{deliveryFee}}`, `{{total}}`, `{{paymentMethod}}`, `{{paymentDetails}}`, `{{prepTimeMin}}`, `{{prepTimeMax}}`, `{{observacoes}}`.
                  </p>
                </div>
                <div className="flex gap-2">
                  {editingTemplate ? (
                    <>
                      <Button onClick={handleUpdateTemplate} className="flex-1">
                        <Edit className="w-4 h-4 mr-2" />
                        Atualizar Modelo
                      </Button>
                      <Button variant="outline" onClick={() => { setEditingTemplate(null); setNewTemplateForm({ name: '', content: '' }); }} className="flex-1">
                        Cancelar Edição
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleCreateTemplate} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Modelo
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="vixxe-shadow rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Modelos Existentes
                </CardTitle>
                <CardDescription>
                  Selecione um modelo para ser o "Diário Ativo".
                </CardDescription>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Carregando modelos...
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum modelo criado ainda.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeDailyTemplate && (
                      <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="font-semibold">Modelo Diário Ativo: {activeDailyTemplate.template_name}</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleClearActiveDailyTemplate}>
                          <XCircle className="w-4 h-4 mr-2" />
                          Desativar
                        </Button>
                      </div>
                    )}
                    {templates.map(template => (
                      <div key={template.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-lg">{template.template_name}</h4>
                          <div className="flex gap-2">
                            {!template.is_active_daily && (
                              <Button variant="outline" size="sm" onClick={() => handleSetActiveDailyTemplate(template.id)}>
                                Definir como Diário
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleEditTemplate(template)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o modelo <strong>{template.template_name}</strong>?
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteTemplate(template.id)} className="bg-red-600 hover:bg-red-700">
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{template.template_content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Sheet de Visualização/Edição de Comanda */}
      <EditComandaSheet
        open={isViewSheetOpen}
        onOpenChange={setIsViewSheetOpen}
        comanda={selectedComandaForView}
        onSave={handleSaveViewedComanda} // Função dummy para visualização
        isViewOnly={true} // Ativa o modo de visualização
      />
    </Card>
  );
}