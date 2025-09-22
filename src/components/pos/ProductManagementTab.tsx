import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Package, Filter, Image, DollarSign, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useProductSupabase } from '@/hooks/useProductSupabase';
import { CategoriaProdutoInsert, ProdutoInsert } from '@/types/supabase';
import { formatCurrency } from '@/lib/order-parser';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client'; // Importar o cliente Supabase
import { v4 as uuidv4 } from 'uuid'; // Para gerar IDs únicos para os arquivos

export function ProductManagementTab() {
  const { 
    categoriasProdutos, 
    produtos, 
    loading, 
    carregarDados,
    criarCategoriaProduto, 
    excluirCategoriaProduto, 
    criarProduto, 
    excluirProduto 
  } = useProductSupabase();

  const [novaCategoriaForm, setNovaCategoriaForm] = useState<CategoriaProdutoInsert>({
    nome: '',
    descricao: '',
  });

  const [novoProdutoForm, setNovoProdutoForm] = useState<ProdutoInsert>({
    nome: '',
    preco: 0,
    categoria_id: '',
    descricao: '',
    imagem_url: '', // Armazenará a URL pública da imagem
  });

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleCriarCategoria = async () => {
    if (!novaCategoriaForm.nome.trim()) {
      toast.error('O nome da categoria é obrigatório.');
      return;
    }
    const success = await criarCategoriaProduto(novaCategoriaForm);
    if (success) {
      setNovaCategoriaForm({ nome: '', descricao: '' });
    }
  };

  const handleExcluirCategoria = async (id: string, nome: string) => {
    // Verificar se existem produtos associados a esta categoria
    const produtosAssociados = produtos.filter(produto => produto.categoria_id === id);
    if (produtosAssociados.length > 0) {
      toast.error(`Não é possível excluir a categoria "${nome}" pois existem ${produtosAssociados.length} produtos associados.`);
      return;
    }
    await excluirCategoriaProduto(id);
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedImageFile(event.target.files[0]);
    } else {
      setSelectedImageFile(null);
    }
  };

  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    setUploadingImage(true);
    try {
      const fileExtension = file.name.split('.').pop();
      const filePath = `product_images/${uuidv4()}.${fileExtension}`; // Usando um bucket chamado 'product-images'

      const { data, error } = await supabase.storage
        .from('product-images') // Nome do bucket no Supabase Storage
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        toast.success('Imagem carregada com sucesso!');
        return publicUrlData.publicUrl;
      } else {
        throw new Error('Não foi possível obter a URL pública da imagem.');
      }
    } catch (error: any) {
      console.error('Erro ao carregar imagem:', error);
      toast.error(`Erro ao carregar imagem: ${error.message}`);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCriarProduto = async () => {
    if (!novoProdutoForm.nome.trim() || novoProdutoForm.preco <= 0 || !novoProdutoForm.categoria_id) {
      toast.error('Nome, preço e categoria do produto são obrigatórios.');
      return;
    }

    let imageUrlToSave = novoProdutoForm.imagem_url; // Começa com a URL existente, se houver

    if (selectedImageFile) {
      const uploadedUrl = await uploadImageToSupabase(selectedImageFile);
      if (uploadedUrl) {
        imageUrlToSave = uploadedUrl;
      } else {
        // Se o upload falhou, não prossegue com a criação do produto
        return;
      }
    }

    const productToCreate: ProdutoInsert = {
      ...novoProdutoForm,
      imagem_url: imageUrlToSave,
    };

    const success = await criarProduto(productToCreate);
    if (success) {
      setNovoProdutoForm({
        nome: '',
        preco: 0,
        categoria_id: '',
        descricao: '',
        imagem_url: '',
      });
      setSelectedImageFile(null); // Limpa o arquivo selecionado
    }
  };

  const handleExcluirProduto = async (id: string, nome: string) => {
    await excluirProduto(id);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl md:text-4xl font-extrabold bg-vixxe-gradient bg-clip-text text-transparent mb-6">
        Gerenciar Produtos e Categorias
      </h1>

      <Tabs defaultValue="produtos">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 rounded-xl p-1 shadow-inner">
          <TabsTrigger value="produtos" className="text-sm data-[state=active]:bg-vixxe-gradient data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-lg transition-all duration-200">
            <Package className="w-4 h-4 mr-2" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="categorias" className="text-sm data-[state=active]:bg-vixxe-gradient data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-lg transition-all duration-200">
            <Filter className="w-4 h-4 mr-2" />
            Categorias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="produtos" className="space-y-6">
          <Card className="vixxe-shadow rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Novo Produto
              </CardTitle>
              <CardDescription>Adicione um novo item ao seu catálogo de vendas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome-produto">Nome do Produto*</Label>
                  <Input
                    id="nome-produto"
                    value={novoProdutoForm.nome}
                    onChange={(e) => setNovoProdutoForm({ ...novoProdutoForm, nome: e.target.value })}
                    placeholder="Ex: X-Bacon Clássico"
                  />
                </div>
                <div>
                  <Label htmlFor="preco-produto">Preço (R$)*</Label>
                  <Input
                    id="preco-produto"
                    type="number"
                    step="0.01"
                    min="0"
                    value={novoProdutoForm.preco}
                    onChange={(e) => setNovoProdutoForm({ ...novoProdutoForm, preco: parseFloat(e.target.value) || 0 })}
                    placeholder="Ex: 28.50"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="categoria-produto">Categoria*</Label>
                <Select
                  value={novoProdutoForm.categoria_id}
                  onValueChange={(value) => setNovoProdutoForm({ ...novoProdutoForm, categoria_id: value })}
                >
                  <SelectTrigger id="categoria-produto">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasProdutos.map(categoria => (
                      <SelectItem key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="imagem-upload">Imagem do Produto (opcional)</Label>
                <Input
                  id="imagem-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  disabled={uploadingImage}
                />
                {(selectedImageFile || novoProdutoForm.imagem_url) && (
                  <div className="mt-2 w-24 h-24 rounded-md overflow-hidden border relative">
                    {uploadingImage && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                    <img 
                      src={selectedImageFile ? URL.createObjectURL(selectedImageFile) : novoProdutoForm.imagem_url || '/placeholder.svg'} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="descricao-produto">Descrição (opcional)</Label>
                <Textarea
                  id="descricao-produto"
                  value={novoProdutoForm.descricao || ''}
                  onChange={(e) => setNovoProdutoForm({ ...novoProdutoForm, descricao: e.target.value })}
                  placeholder="Uma breve descrição do produto..."
                  rows={2}
                />
              </div>
              <Button onClick={handleCriarProduto} className="w-full" disabled={loading || uploadingImage}>
                <Plus className="w-4 h-4 mr-2" />
                {loading || uploadingImage ? 'Adicionando...' : 'Adicionar Produto'}
              </Button>
            </CardContent>
          </Card>

          <Card className="vixxe-shadow rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Produtos Cadastrados
              </CardTitle>
              <CardDescription>{produtos.length} produtos no catálogo.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando produtos...</div>
              ) : produtos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Nenhum produto cadastrado.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {produtos.map(produto => (
                    <Card key={produto.id} className="rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="w-full h-32 bg-muted flex items-center justify-center">
                          {produto.imagem_url ? (
                            <img src={produto.imagem_url} alt={produto.nome} className="w-full h-full object-cover" />
                          ) : (
                            <Image className="w-12 h-12 text-muted-foreground" />
                          )}
                        </div>
                        <div className="p-4 space-y-2">
                          <h3 className="font-semibold text-lg">{produto.nome}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {categoriasProdutos.find(c => c.id === produto.categoria_id)?.nome || 'Sem Categoria'}
                          </Badge>
                          <p className="text-muted-foreground text-sm">{produto.descricao}</p>
                          <div className="flex justify-between items-center pt-2 border-t border-dashed border-muted-foreground/20">
                            <span className="font-bold text-xl text-primary">{formatCurrency(produto.preco)}</span>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o produto <strong>{produto.nome}</strong>?
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleExcluirProduto(produto.id, produto.nome)} className="bg-red-600 hover:bg-red-700">
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categorias" className="space-y-6">
          <Card className="vixxe-shadow rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Nova Categoria
              </CardTitle>
              <CardDescription>Crie uma nova categoria para organizar seus produtos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nome-categoria">Nome da Categoria*</Label>
                <Input
                  id="nome-categoria"
                  value={novaCategoriaForm.nome}
                  onChange={(e) => setNovaCategoriaForm({ ...novaCategoriaForm, nome: e.target.value })}
                  placeholder="Ex: Bebidas, Sobremesas"
                />
              </div>
              <div>
                <Label htmlFor="descricao-categoria">Descrição (opcional)</Label>
                <Textarea
                  id="descricao-categoria"
                  value={novaCategoriaForm.descricao || ''}
                  onChange={(e) => setNovaCategoriaForm({ ...novaCategoriaForm, descricao: e.target.value })}
                  placeholder="Uma breve descrição da categoria..."
                  rows={2}
                />
              </div>
              <Button onClick={handleCriarCategoria} className="w-full" disabled={loading}>
                <Plus className="w-4 h-4 mr-2" />
                {loading ? 'Adicionando...' : 'Adicionar Categoria'}
              </Button>
            </CardContent>
          </Card>

          <Card className="vixxe-shadow rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Categorias Existentes
              </CardTitle>
              <CardDescription>{categoriasProdutos.length} categorias cadastradas.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando categorias...</div>
              ) : categoriasProdutos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Nenhuma categoria cadastrada.</div>
              ) : (
                <div className="space-y-3">
                  {categoriasProdutos.map(categoria => (
                    <div key={categoria.id} className="flex justify-between items-center p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <h3 className="font-medium text-lg">{categoria.nome}</h3>
                        <p className="text-sm text-muted-foreground">{categoria.descricao}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {produtos.filter(p => p.categoria_id === categoria.id).length} produtos
                        </Badge>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            disabled={produtos.filter(p => p.categoria_id === categoria.id).length > 0}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a categoria <strong>{categoria.nome}</strong>?
                              Esta ação não pode ser desfeita.
                              <br/>
                              **Atenção:** A categoria só pode ser excluída se não houver produtos associados a ela.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleExcluirCategoria(categoria.id, categoria.nome)} className="bg-red-600 hover:bg-red-700">
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}