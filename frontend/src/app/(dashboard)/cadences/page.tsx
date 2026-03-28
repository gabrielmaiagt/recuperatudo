"use client";

import { API_URL } from "@/lib/api";

import { useState, useEffect } from "react";
import { Plus, Settings, Play, Pause, Trash2, ArrowRight, Save, Clock, Mail, MessageCircle, CheckCircle2, MoreHorizontal, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function CadencesPage() {
  const [cadences, setCadences] = useState<any[]>([]);
  const [gateways, setGateways] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [step, setStep] = useState(1);

  // Flow Builder State
  const [newName, setNewName] = useState("");
  const [newGateway, setNewGateway] = useState("");
  const [newTrigger, setNewTrigger] = useState("");
  const [newProduct, setNewProduct] = useState("");
  const [flowSteps, setFlowSteps] = useState<any[]>([
    { id: 1, type: "whatsapp", delay: "imediato", message: "Olá {{nome}}, vi que você quase finalizou a compra...", subject: "", instanceId: "1" }
  ]);

  const fetchGateways = async () => {
    try {
      const res = await fetch(`${API_URL}/gateways`);
      if (res.ok) setGateways(await res.json());
    } catch(e) { console.error(e); }
  }

  const fetchAutomations = async () => {
    try {
      const res = await fetch(`${API_URL}/automations`);
      if (res.ok) setCadences(await res.json());
    } catch(e) { console.error(e); } finally { setIsLoading(false); }
  }

  useEffect(() => {
    fetchGateways();
    fetchAutomations();
    const interval = setInterval(fetchAutomations, 15000);
    return () => clearInterval(interval);
  }, []);

  const clearForm = () => {
    setNewName("");
    setNewGateway("");
    setNewTrigger("");
    setNewProduct("");
    setFlowSteps([{ id: 1, type: "whatsapp", delay: "imediato", message: "", subject: "", instanceId: "1" }]);
    setStep(1);
  };

  const addFlowStep = (type: string) => {
    setFlowSteps([...flowSteps, { id: Date.now(), type, delay: "1h", message: "", subject: type === 'email' ? "Assunto Importante" : "", instanceId: "1" }]);
  };

  const removeFlowStep = (id: number) => {
    setFlowSteps(flowSteps.filter(s => s.id !== id));
  };

  const updateFlowStep = (id: number, field: string, value: string) => {
    setFlowSteps(flowSteps.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSaveAutomation = async () => {
    if (!newName || !newGateway || !newTrigger || flowSteps.length === 0) {
      toast.error("Preencha as informações da Etapa 1 e crie pelo menos um passo.");
      return;
    }

    try {
      const payload = {
        name: newName,
        gateway: newGateway,
        trigger: newTrigger,
        targetProduct: newProduct,
        steps: flowSteps
      };

      const res = await fetch(`${API_URL}/automations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Automação ativa com sucesso!");
        fetchAutomations();
        setIsAddModalOpen(false);
        clearForm();
      } else {
        toast.error("Erro ao ativar automação.");
      }
    } catch (e) {
      toast.error("Erro interno no servidor.");
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Tem certeza que deseja apagar essa Automação? O fluxo de vendas dela irá parar imediatamente.")) return;
    try {
      const res = await fetch(`${API_URL}/automations/${id}`, { method: 'DELETE' });
      if(res.ok) {
        toast.success("Automação excluída.");
        fetchAutomations();
      }
    } catch(e) { toast.error("Falha ao excluir."); }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      const res = await fetch(`${API_URL}/automations/${id}/status`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if(res.ok) {
        toast.success(`Automação ${newStatus === "ACTIVE" ? "Retomada" : "Pausada"}.`);
        fetchAutomations();
      }
    } catch(e) { toast.error("Falha ao atualizar status."); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automações / Fluxos</h1>
          <p className="text-muted-foreground">Crie e gerencie passos automáticos de WhatsApp e E-mail para vendas, abandonos e entregáveis.</p>
        </div>

        <Dialog open={isAddModalOpen} onOpenChange={(open) => { setIsAddModalOpen(open); if(!open) clearForm(); }}>
          <DialogTrigger render={<Button className="gap-2 shrink-0" />}>
            <Plus className="h-4 w-4" />
            Criar Nova Cadência
          </DialogTrigger>
          <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Nova Cadência</DialogTitle>
              <DialogDescription>
                Configure as etapas do fluxo que será disparado pelo gateway.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-auto py-4">
              {step === 1 && (
                <div className="grid gap-6 px-1">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><Settings className="w-5 h-5"/> Etapa 1: Configuração Básica</h3>
                    <div className="grid gap-2">
                      <Label>Nome da Cadência</Label>
                      <Input placeholder="Ex: Carrinho Abandonado P1" value={newName} onChange={e => setNewName(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Gateway Vinculado</Label>
                        <Select value={newGateway} onValueChange={setNewGateway}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            {gateways.length === 0 && <SelectItem value="none" disabled>Nenhum gateway cadastrado</SelectItem>}
                            {gateways.map(g => (
                               <SelectItem key={g.id} value={g.id}>{g.name} ({g.type})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Gatilho (Trigger)</Label>
                        <Select value={newTrigger} onValueChange={setNewTrigger}>
                          <SelectTrigger><SelectValue placeholder="Selecione o evento" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="abandonment">Abandono de Carrinho (Recuperação)</SelectItem>
                            <SelectItem value="refused">Venda Recusada / Pix Não Pago (Recuperação)</SelectItem>
                            <SelectItem value="approved">Venda Aprovada (Entregável / Boas Vindas)</SelectItem>
                            <SelectItem value="upsell">Compra de Upsell / Downsell (Cross-sell)</SelectItem>
                            <SelectItem value="subscription_active">Assinatura Ativada / Renovada (Recorrência)</SelectItem>
                            <SelectItem value="subscription_overdue">Assinatura Vencida / Atrasada (Recorrência)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2 mt-2">
                      <Label>Produto Específico (Opcional)</Label>
                      <Input placeholder="Nome exato do produto (Deixe branco para Todos)" value={newProduct} onChange={e => setNewProduct(e.target.value)} />
                      <span className="text-[10px] text-muted-foreground -mt-1">Trave a automação para atirar apenas se for este item.</span>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-6 px-1 h-full flex-col flex">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5"/> Etapa 2: Construir Fluxo
                    </h3>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => addFlowStep("whatsapp")} className="gap-2 text-green-500 hover:text-green-600">
                        <MessageCircle className="w-4 h-4"/> Add WhatsApp
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => addFlowStep("email")} className="gap-2 text-blue-500 hover:text-blue-600">
                        <Mail className="w-4 h-4"/> Add E-mail
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4 border-l-2 border-muted pl-4 ml-2 relative">
                    {flowSteps.map((s, index) => (
                      <Card key={s.id} className="relative z-10 w-full mb-4 group shadow-sm">
                        <div className="absolute -left-[35px] top-6 w-8 border-t-2 border-muted" />
                        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between bg-muted/20 border-b border-border/50">
                          <div className="flex justify-between items-center w-full">
                            <div className="flex items-center gap-2">
                              {s.type === 'whatsapp' ? <MessageCircle className="w-4 h-4 text-green-500"/> : <Mail className="w-4 h-4 text-blue-500"/>}
                              <span className="font-semibold text-sm capitalize">{s.type}</span>
                              <Badge variant="outline" className="ml-2 bg-background font-mono text-[10px]">Passo {index + 1}</Badge>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeFlowStep(s.id)}>
                              <Trash2 className="w-4 h-4"/>
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 grid gap-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                              <Label className="text-xs">Tempo de Envio</Label>
                              <Select value={s.delay} onValueChange={v => updateFlowStep(s.id, "delay", v)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="imediato">Imediato</SelectItem>
                                  <SelectItem value="15m">Após 15 minutos</SelectItem>
                                  <SelectItem value="1h">Após 1 hora</SelectItem>
                                  <SelectItem value="24h">Após 24 horas</SelectItem>
                                  <SelectItem value="7d">Após 7 dias</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {s.type === 'email' && (
                              <div className="grid gap-2 col-span-2">
                                <Label className="text-xs">Assunto do E-mail</Label>
                                <Input className="h-8 text-xs" placeholder="Ex: Você esqueceu algo no carrinho!" value={s.subject} onChange={e => updateFlowStep(s.id, "subject", e.target.value)} />
                              </div>
                            )}
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-xs flex justify-between">
                              Mensagem
                              <span className="font-normal text-[10px] text-muted-foreground">Variáveis úteis: {'{{nome}}, {{primeiro_nome}}, {{valor}}, {{produto}}, {{link_acesso}}'}</span>
                            </Label>
                            <Textarea 
                              className="min-h-[100px] text-sm resize-none" 
                              placeholder={`Escreva aqui sua copy...`}
                              value={s.message}
                              onChange={e => updateFlowStep(s.id, "message", e.target.value)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {flowSteps.length === 0 && (
                      <div className="p-8 text-center border-2 border-dashed border-muted rounded-xl bg-muted/10 text-muted-foreground text-sm">
                        Nenhum passo no fluxo. Adicione um para construir a cadência.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="grid gap-6 px-1 text-center py-10">
                  <CheckCircle2 className="w-16 h-16 text-primary mx-auto"/>
                  <div className="space-y-2">
                    <h3 className="font-bold text-2xl">Revisão Final</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Sua cadência está pronta para ser salva na base. Ao ativar, 
                      qualquer novo evento do gateway iniciará este fluxo oficial.
                    </p>
                  </div>
                  <div className="flex bg-muted/30 border border-border/50 rounded-lg p-4 justify-around mx-auto mt-4 w-full">
                     <div className="text-center"><p className="text-xs text-muted-foreground uppercase">Passos</p><p className="font-bold text-lg">{flowSteps.length}</p></div>
                     <div className="text-center"><p className="text-xs text-muted-foreground uppercase">Gatilho</p><p className="font-bold text-lg truncate w-[150px] capitalize">{newTrigger}</p></div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-4 border-t border-border mt-auto">
              <Button variant="ghost" onClick={() => step > 1 ? setStep(step - 1) : setIsAddModalOpen(false)}>
                Voltar
              </Button>
              {step === 1 ? (
                <Button onClick={() => {
                   if(!newName || !newGateway || !newTrigger) { toast.error("Preencha todos os campos."); return; }
                   setStep(2);
                }} className="gap-2">Próximo Passo <ArrowRight className="w-4 h-4"/></Button>
              ) : step === 2 ? (
                <Button onClick={() => setStep(3)} className="gap-2">Revisar <ArrowRight className="w-4 h-4"/></Button>
              ) : (
                <Button onClick={handleSaveAutomation} className="gap-2"><Save className="w-4 h-4"/> Salvar e Ativar</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
           <Activity className="h-8 w-8 text-muted-foreground animate-spin" />
        </div>
      ) : cadences.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card border border-dashed rounded-lg">
           <Settings className="h-12 w-12 text-muted-foreground/30 mb-4" />
           <p className="text-muted-foreground text-sm">Nenhuma automação registrada no Banco de Dados.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cadences.map((cadence) => {
             const gwName = gateways.find(g => g.id === cadence.gateway)?.name || cadence.gateway;
             return (
              <Card key={cadence.id} className={`bg-card/50 backdrop-blur-sm shadow-sm flex flex-col hover:-translate-y-1 transition-transform cursor-pointer group ${cadence.status === "PAUSED" ? 'opacity-75 grayscale-[50%]' : ''}`}>
                <CardHeader className="pb-3 text-sm flex flex-col justify-between items-start gap-2">
                   <div className="flex w-full justify-between items-start">
                      <Badge variant={cadence.status === "ACTIVE" ? "default" : "secondary"} className={cadence.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : ""}>
                         {cadence.status === "ACTIVE" ? "🟢 Ativa" : "⏸️ Pausada"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" />}>
                          <MoreHorizontal className="w-4 h-4"/>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleToggleStatus(cadence.id, cadence.status)}>
                            {cadence.status === "ACTIVE" ? "Pausar Envios" : "Retomar Envios"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(cadence.id)} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                   </div>
                   <div>
                      <CardTitle className="leading-tight mb-1 text-lg">{cadence.name}</CardTitle>
                      <CardDescription className="flex flex-col gap-1 mt-2">
                         <span className="flex items-center gap-1"><Settings className="w-3 h-3"/> Gateway: {gwName}</span>
                         <span className="flex items-center gap-1 text-primary"><Play className="w-3 h-3"/> Gatilho: <span className="uppercase text-[10px] font-bold">{cadence.trigger}</span></span>
                         <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> Passos de fluxo: {cadence.steps?.length || 0}</span>
                      </CardDescription>
                   </div>
                </CardHeader>
                <CardContent className="mt-auto">
                   <div className="flex justify-between items-end border-t border-border/50 pt-3">
                      <div className="flex flex-col">
                         <span className="text-xs text-muted-foreground uppercase font-semibold">Leads processados</span>
                         <span className="text-2xl font-bold font-mono">Real-time</span>
                      </div>
                   </div>
                </CardContent>
              </Card>
             );
          })}
        </div>
      )}
    </div>
  );
}
