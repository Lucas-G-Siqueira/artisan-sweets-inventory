
import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function EstoqueDoces() {
  const [doces, setDoces] = useState([]);
  const [novoDoce, setNovoDoce] = useState({
    nome: '',
    sabor: '',
    categoria: '',
    quantidade: '',
    preco: '',
    data_fabricacao: '',
    data_validade: '',
    status: 'Disponível',
    observacoes: ''
  });
  const [filtros, setFiltros] = useState({ sabor: '', categoria: '', precoMax: '' });
  const [doceSelecionado, setDoceSelecionado] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Função para buscar os doces do Supabase e calcular o status
  const fetchDoces = async () => {
    try {
      const { data, error } = await supabase
        .from('estoque_doces')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Mapeia os doces para adicionar/atualizar o status baseado na data de validade
      const docesComStatus = data.map(doce => {
        const hoje = new Date();
        const dataValidade = new Date(doce.data_validade + 'T00:00:00');
        const umDia = 24 * 60 * 60 * 1000;
        const seteDias = 7 * umDia;

        let statusDoce = 'Disponível';
        if (dataValidade < hoje) {
          statusDoce = 'Vencido';
        } else if (dataValidade.getTime() - hoje.getTime() <= seteDias) {
          statusDoce = 'Próximo do vencimento';
        }
        return { ...doce, status: statusDoce };
      });

      setDoces(docesComStatus);
    } catch (error) {
      console.error("Erro ao buscar doces:", error);
      toast({
        title: "Erro ao carregar doces",
        description: "Não foi possível buscar os dados do estoque.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchDoces();
  }, []);

  // Lógica para aplicar os filtros
  const aplicarFiltros = (doce) => {
    const precoCond = filtros.precoMax ? doce.preco <= parseFloat(filtros.precoMax) : true;
    const saborCond = filtros.sabor ? doce.sabor.toLowerCase().includes(filtros.sabor.toLowerCase()) : true;
    const catCond = filtros.categoria ? doce.categoria?.toLowerCase().includes(filtros.categoria.toLowerCase()) : true;
    return precoCond && saborCond && catCond;
  };

  // Função para cadastrar um novo doce
  const cadastrarDoce = async () => {
    // Validação básica dos campos obrigatórios
    if (!novoDoce.nome || !novoDoce.sabor || !novoDoce.quantidade || !novoDoce.preco || !novoDoce.data_validade) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o nome, sabor, quantidade, preço e data de validade.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('estoque_doces')
        .insert([{
          ...novoDoce,
          quantidade: parseInt(novoDoce.quantidade),
          preco: parseFloat(novoDoce.preco)
        }]);

      if (error) {
        throw error;
      }

      // Limpa o formulário e atualiza a lista
      setNovoDoce({ 
        nome: '', sabor: '', categoria: '', quantidade: '', 
        preco: '', data_fabricacao: '', data_validade: '', 
        status: 'Disponível', observacoes: '' 
      });
      fetchDoces();
      toast({
        title: "Sucesso!",
        description: "Doce cadastrado com sucesso no estoque.",
      });
    } catch (error) {
      console.error("Erro ao cadastrar doce:", error);
      toast({
        title: "Erro ao cadastrar",
        description: `Não foi possível cadastrar o doce. ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Função para excluir um doce
  const excluirDoce = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este doce? Esta ação é irreversível.')) return;

    try {
      const { error } = await supabase
        .from('estoque_doces')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      fetchDoces();
      toast({
        title: "Doce excluído",
        description: "O doce foi removido do estoque com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao excluir doce:", error);
      toast({
        title: "Erro ao excluir",
        description: `Não foi possível excluir o doce. ${error.message}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-extrabold text-center text-rose-600 mb-8">
        🍭 Controle de Estoque de Doces Caseiros 🍰
      </h1>

      {/* --- Seção de Filtros --- */}
      <Card className="shadow-lg border-rose-200">
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          <div className="space-y-2">
            <Label htmlFor="filtroSabor" className="text-lg text-rose-700 font-semibold">Sabor</Label>
            <Input
              id="filtroSabor"
              value={filtros.sabor}
              onChange={(e) => setFiltros({ ...filtros, sabor: e.target.value })}
              placeholder="Ex: Morango"
              className="border-rose-300 focus:border-rose-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filtroCategoria" className="text-lg text-rose-700 font-semibold">Categoria</Label>
            <Input
              id="filtroCategoria"
              value={filtros.categoria}
              onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
              placeholder="Ex: Brigadeiro"
              className="border-rose-300 focus:border-rose-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filtroPrecoMax" className="text-lg text-rose-700 font-semibold">Preço Máximo (R$)</Label>
            <Input
              id="filtroPrecoMax"
              type="number"
              value={filtros.precoMax}
              onChange={(e) => setFiltros({ ...filtros, precoMax: e.target.value })}
              placeholder="Ex: 10.50"
              className="border-rose-300 focus:border-rose-500"
              step="0.01"
              min="0"
            />
          </div>
        </CardContent>
      </Card>

      {/* --- Seção de Cadastro de Novo Doce --- */}
      <Card className="shadow-lg border-rose-200">
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
          <h2 className="col-span-full text-2xl font-bold text-rose-700 mb-4">Cadastrar Novo Doce</h2>
          {Object.entries(novoDoce).map(([key, value]) => (
            key !== 'status' && (
              <div key={key} className="space-y-2">
                <Label className="capitalize text-rose-700">{key.replace('_', ' ')}</Label>
                <Input
                  value={value}
                  type={
                    key === 'quantidade' ? 'number' :
                    key === 'preco' ? 'number' :
                    key.includes('data') ? 'date' : 'text'
                  }
                  onChange={(e) => setNovoDoce({ ...novoDoce, [key]: e.target.value })}
                  className="border-rose-300 focus:border-rose-500"
                  step={key === 'preco' ? "0.01" : "1"}
                  min={key === 'quantidade' || key === 'preco' ? "0" : undefined}
                />
              </div>
            )
          ))}
          <div className="col-span-full pt-4">
            <Button
              onClick={cadastrarDoce}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              Adicionar Doce
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- Tabela de Doces --- */}
      <Card className="shadow-lg border-rose-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-rose-100">
              <TableRow>
                <TableHead className="font-bold text-rose-800">Nome</TableHead>
                <TableHead className="font-bold text-rose-800">Sabor</TableHead>
                <TableHead className="font-bold text-rose-800">Categoria</TableHead>
                <TableHead className="font-bold text-rose-800">Quantidade</TableHead>
                <TableHead className="font-bold text-rose-800">Preço</TableHead>
                <TableHead className="font-bold text-rose-800">Validade</TableHead>
                <TableHead className="font-bold text-rose-800">Status</TableHead>
                <TableHead className="font-bold text-rose-800 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doces.filter(aplicarFiltros).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Nenhum doce encontrado com os filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                doces.filter(aplicarFiltros).map((doce) => (
                  <TableRow
                    key={doce.id}
                    className={
                      doce.status === 'Vencido' ? 'bg-red-50 hover:bg-red-100' :
                      doce.status === 'Próximo do vencimento' ? 'bg-yellow-50 hover:bg-yellow-100' :
                      'hover:bg-gray-50'
                    }
                  >
                    <TableCell className="font-medium">{doce.nome}</TableCell>
                    <TableCell>{doce.sabor}</TableCell>
                    <TableCell>{doce.categoria}</TableCell>
                    <TableCell className={doce.quantidade < 5 ? 'text-red-600 font-bold' : ''}>
                      {doce.quantidade}
                    </TableCell>
                    <TableCell>R$ {doce.preco ? doce.preco.toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '0,00'}</TableCell>
                    <TableCell>{doce.data_validade}</TableCell>
                    <TableCell
                      className={
                        doce.status === 'Vencido' ? 'text-red-700 font-semibold' :
                        doce.status === 'Próximo do vencimento' ? 'text-yellow-700 font-semibold' :
                        'text-green-700'
                      }
                    >
                      {doce.status}
                    </TableCell>
                    <TableCell className="space-x-2 flex justify-end">
                      <Dialog open={isDialogOpen && doceSelecionado?.id === doce.id} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDoceSelecionado(doce);
                              setIsDialogOpen(true);
                            }}
                            className="border-rose-400 text-rose-600 hover:bg-rose-100"
                          >
                            Detalhes
                          </Button>
                        </DialogTrigger>
                        {doceSelecionado && (
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle className="text-2xl text-rose-700">Detalhes do Doce</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              {Object.entries(doceSelecionado).map(([key, val]) => (
                                <div key={key} className="grid grid-cols-3 items-center gap-4">
                                  <Label className="col-span-1 text-right font-semibold capitalize text-rose-800">
                                    {key.replace('_', ' ')}:
                                  </Label>
                                  <span className="col-span-2 text-gray-700">
                                    {key === 'preco' ? `R$ ${parseFloat(val).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` :
                                     val?.toString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </DialogContent>
                        )}
                      </Dialog>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => excluirDoce(doce.id)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
