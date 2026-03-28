"use client";

import { useState, useEffect } from "react";
import { Plus, Copy, MoreHorizontal, Webhook, Activity, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function GatewaysPage() {
  const [gateways, setGateways] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGatewayName, setNewGatewayName] = useState("");
  const [newGatewayType, setNewGatewayType] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [gatewayToDelete, setGatewayToDelete] = useState<any>(null);
  const [gatewayToRename, setGatewayToRename] = useState<any>(null);
  const [renameValue, setRenameValue] = useState("");

  const fetchGateways = async () => {
    try {
      const res = await fetch('http://localhost:3333/api/gateways');
      if (res.ok) {
        const data = await res.json();
        setGateways(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGateways();
    // Autorefresh every 15 seconds to pull new events
    const interval = setInterval(fetchGateways, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAddGateway = async () => {
    if (!newGatewayName.trim() || !newGatewayType) {
      toast.error("Preencha todos os campos.");
      return;
    }
    
    try {
      const res = await fetch('http://localhost:3333/api/gateways', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ name: newGatewayName, type: newGatewayType })
      });

      if (res.ok) {
         const data = await res.json();
         setGeneratedUrl(data.url);
         toast.success("Gateway criado com sucesso!");
         fetchGateways();
      } else {
         toast.error("Erro na criação do gateway.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro interno ao criar gateway.");
    }
  };

  const confirmDelete = async () => {
    if (!gatewayToDelete) return;
    try {
      const res = await fetch(`http://localhost:3333/api/gateways/${gatewayToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
         toast.success("Gateway deletado com sucesso.");
         fetchGateways();
      }
    } catch (e) {
       toast.error("Falha ao deletar.");
    } finally {
       setGatewayToDelete(null);
    }
  };

  const confirmRename = async () => {
    if (!gatewayToRename || !renameValue.trim() || renameValue === gatewayToRename.name) {
       setGatewayToRename(null);
       return;
    }
    
    try {
      const res = await fetch(`http://localhost:3333/api/gateways/${gatewayToRename.id}`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ name: renameValue })
      });
      if (res.ok) {
         toast.success("Gateway renomeado!");
         fetchGateways();
      } else {
         toast.error("Erro ao renomear.");
      }
    } catch (e) {
       toast.error("Falha ao renomear.");
    } finally {
       setGatewayToRename(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("URL copiada para a área de transferência.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gateways de Pagamento</h1>
          <p className="text-muted-foreground">Configure as plataformas para receber eventos em tempo real.</p>
        </div>

        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger render={<Button className="gap-2 shrink-0" />}>
            <Plus className="h-4 w-4" />
            Adicionar Gateway
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Gateway</DialogTitle>
              <DialogDescription>
                Selecione a plataforma para gerar uma URL de webhook única oficial.
              </DialogDescription>
            </DialogHeader>
            {!generatedUrl ? (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome (Identificação)</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Checkout Principal"
                    value={newGatewayName}
                    onChange={(e) => setNewGatewayName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Plataforma</Label>
                  <Select onValueChange={(val) => val && setNewGatewayType(val)} value={newGatewayType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o Gateway" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buckpay">BuckPay</SelectItem>
                      <SelectItem value="hotmart">Hotmart</SelectItem>
                      <SelectItem value="kiwify">Kiwify</SelectItem>
                      <SelectItem value="perfectpay">PerfectPay</SelectItem>
                      <SelectItem value="other">Outro (Custom)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-4 py-4">
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-sm text-center">
                  <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-medium text-foreground">Gateway gerado com sucesso!</p>
                  <p className="text-muted-foreground mt-1">Sua nova ponte com a base de dados central foi criada.</p>
                </div>
                <div className="flex w-full items-center space-x-2">
                  <Input value={generatedUrl} readOnly className="font-mono text-xs bg-muted" />
                  <Button type="button" size="sm" onClick={() => copyToClipboard(generatedUrl)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            <DialogFooter>
              {!generatedUrl ? (
                <Button onClick={handleAddGateway}>Salvar Servidor</Button>
              ) : (
                <Button variant="outline" onClick={() => { setIsAddModalOpen(false); setGeneratedUrl(""); setNewGatewayName(""); }}>
                  Concluir
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={!!gatewayToDelete} onOpenChange={(open) => !open && setGatewayToDelete(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Desconectar Gateway</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o recebimento do Gateway <strong>{gatewayToDelete?.name}</strong>? Isso afetará novas vendas!
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGatewayToDelete(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={confirmDelete}>Desconectar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rename Dialog */}
        <Dialog open={!!gatewayToRename} onOpenChange={(open) => !open && setGatewayToRename(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Renomear Gateway</DialogTitle>
              <DialogDescription>
                Digite o novo nome para o Gateway <strong>{gatewayToRename?.name}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 font-sans">
               <Label htmlFor="renameInput" className="mb-2 block">Novo Nome</Label>
               <Input id="renameInput" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGatewayToRename(null)}>Cancelar</Button>
              <Button onClick={confirmRename}>Salvar Objeto</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
           <Activity className="h-8 w-8 text-muted-foreground animate-spin" />
        </div>
      ) : gateways.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card border border-dashed rounded-lg">
           <Webhook className="h-12 w-12 text-muted-foreground/30 mb-4" />
           <p className="text-muted-foreground text-sm">Você ainda não conectou nenhum Gateway.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {gateways.map((gateway) => (
            <Card key={gateway.id} className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm relative overflow-hidden flex flex-col">
              <div className={`absolute top-0 right-0 w-2 h-full ${gateway.status === "ACTIVE" ? "bg-emerald-500" : "bg-muted"}`} />
              <CardHeader className="pb-4 border-b border-border/50 pr-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Webhook className="h-4 w-4 text-primary" />
                      {gateway.name}
                    </CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className="mr-2 text-[10px] uppercase font-semibold">{gateway.type}</Badge>
                      {gateway.status === "ACTIVE" ? (
                        <span className="text-emerald-500 text-xs font-medium focus-within:">● Online</span>
                      ) : (
                        <span className="text-muted-foreground text-xs font-medium">● Offline</span>
                      )}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 absolute top-4 right-4" />}>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setRenameValue(gateway.name); setGatewayToRename(gateway); }}>Editar Nome</DropdownMenuItem>
                      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setGatewayToDelete(gateway); }} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">Desconectar Gateway</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 flex-1">
                <div className="space-y-2">
                  <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Ponte (Endpoint) Oficial</Label>
                  <div className="flex w-full items-center space-x-2">
                    <Input value={gateway.url} readOnly className="h-8 font-mono text-[11px] bg-muted/50 border-muted text-muted-foreground" />
                    <Button type="button" size="sm" variant="secondary" className="h-8 px-3" onClick={() => copyToClipboard(gateway.url)}>
                      Copiar
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
                    <Activity className="h-3 w-3" /> Eventos Reais (Log)
                  </Label>
                  {gateway.recent && gateway.recent.length > 0 ? (
                    <div className="text-sm space-y-2">
                      {gateway.recent.map((ev: any, i: number) => (
                        <div key={i} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0 hover:bg-muted/30 px-2 rounded-sm transition-colors cursor-default">
                          <span className="font-medium text-[11px] uppercase">{ev.type}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono">{ev.value}</span>
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 rounded">{ev.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground p-3 border border-dashed border-muted rounded-md text-center bg-muted/20">
                      Nenhum recebimento de webhook captado ainda.
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-2 pb-4 mt-auto">
                 <Dialog>
                   <DialogTrigger render={<Button variant="ghost" className="w-full text-primary hover:text-primary hover:bg-primary/10 h-8 text-xs" size="sm" />}>
                     Abrir Histórico Completo
                   </DialogTrigger>
                   <DialogContent className="sm:max-w-[500px]">
                     <DialogHeader>
                       <DialogTitle>Múltiplos Disparos Recentes</DialogTitle>
                       <DialogDescription>
                         Rastreio Oficial Node.js para os webhooks capturados em <strong>{gateway.name}</strong>.
                       </DialogDescription>
                     </DialogHeader>
                     <div className="py-4">
                       <div className="rounded-md border border-border/50 max-h-[300px] overflow-y-auto bg-muted/10 p-2 space-y-2">
                         {gateway.recent && gateway.recent.length > 0 ? (
                           <>
                             {gateway.recent.map((ev: any, i: number) => (
                               <div key={i} className="flex justify-between items-center py-2 px-3 bg-background border border-border/50 rounded shadow-sm text-sm">
                                 <div className="flex flex-col">
                                   <span className="font-semibold text-primary uppercase text-xs">{ev.type}</span>
                                   <span className="text-[10px] text-muted-foreground">{ev.time}</span>
                                 </div>
                                 <span className="font-mono bg-muted/60 border border-border/50 px-2 py-1 rounded-sm text-xs">{ev.value}</span>
                               </div>
                             ))}
                             <div className="text-center text-[10px] text-muted-foreground pt-2">Exibindo os últimos 5 recebimentos oficiais.</div>
                           </>
                         ) : (
                            <div className="text-center text-sm text-muted-foreground py-10 flex flex-col items-center gap-2">
                              <Activity className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                              O banco de logs deste Gateway está limpo.
                            </div>
                         )}
                       </div>
                     </div>
                   </DialogContent>
                 </Dialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
