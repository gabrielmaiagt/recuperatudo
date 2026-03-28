"use client";

import { useState, useEffect } from "react";
import { Filter, Search, History, Check, Clock, RotateCw, ExternalLink, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeads = async () => {
    try {
      const res = await fetch('http://localhost:3333/api/leads');
      if (res.ok) setLeads(await res.json());
    } catch(e) { console.error(e); } finally { setIsLoading(false); }
  }

  useEffect(() => {
    fetchLeads();
    const interval = setInterval(fetchLeads, 15000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONVERTED": return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">Convertido (Recuperado)</Badge>;
      case "IN_CADENCE": return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">Automação Ativa</Badge>;
      case "COMPLETED": return <Badge variant="secondary" className="text-muted-foreground">Finalizado</Badge>;
      default: return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">Histórico de vendas e abandonos processados pelo sistema.</p>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm shadow-sm border-border/50">
        <CardHeader className="pb-3 block">
           <div className="flex flex-col md:flex-row gap-4 items-center justify-between w-full">
             <div className="flex items-center gap-2 w-full md:w-auto flex-1">
               <Search className="h-4 w-4 text-muted-foreground absolute ml-3"/>
               <Input 
                 placeholder="Buscar por nome, email ou telefone..." 
                 className="pl-9 bg-background w-full md:max-w-md"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
             
             <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
               <Select defaultValue="all">
                 <SelectTrigger className="w-[140px] bg-background"><Filter className="w-3 h-3 mr-2"/><SelectValue placeholder="Gateway" /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">Todos Gateways</SelectItem>
                   <SelectItem value="buckpay">BuckPay</SelectItem>
                   <SelectItem value="hotmart">Hotmart</SelectItem>
                   <SelectItem value="kiwify">Kiwify</SelectItem>
                 </SelectContent>
               </Select>
               
               <Select defaultValue="all">
                 <SelectTrigger className="w-[150px] bg-background"><Check className="w-3 h-3 mr-2"/><SelectValue placeholder="Status" /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">Todos Status</SelectItem>
                   <SelectItem value="in_cadence">Ativos no Fluxo</SelectItem>
                   <SelectItem value="converted">Convertidos</SelectItem>
                   <SelectItem value="completed">Finalizados</SelectItem>
                 </SelectContent>
               </Select>

               <Select defaultValue="7d">
                 <SelectTrigger className="w-[140px] bg-background"><Clock className="w-3 h-3 mr-2"/><SelectValue placeholder="Período" /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="today">Hoje</SelectItem>
                   <SelectItem value="7d">Últimos 7 dias</SelectItem>
                   <SelectItem value="30d">Últimos 30 dias</SelectItem>
                   <SelectItem value="all">Todo período</SelectItem>
                 </SelectContent>
               </Select>
             </div>
           </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden bg-background">
            <Table>
              <TableHeader className="bg-muted/50 text-xs uppercase tracking-wider">
                <TableRow>
                  <TableHead className="font-semibold text-muted-foreground">Lead</TableHead>
                  <TableHead className="font-semibold text-muted-foreground hidden md:table-cell">Produto</TableHead>
                  <TableHead className="font-semibold text-muted-foreground hidden lg:table-cell">Gateway</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Data/Hora</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-muted-foreground hidden xl:table-cell">Próximo Disparo</TableHead>
                  <TableHead className="text-right font-semibold text-muted-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                     <TableCell colSpan={7} className="h-32 text-center">
                        <Activity className="h-6 w-6 text-muted-foreground animate-spin mx-auto" />
                     </TableCell>
                  </TableRow>
                ) : leads.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        Nenhum lead processado ainda.
                     </TableCell>
                  </TableRow>
                ) : leads.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.email.toLowerCase().includes(searchTerm.toLowerCase())).map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-muted/20 hover:cursor-default transition-colors group">
                    <TableCell className="font-medium p-3">
                      <div className="flex flex-col">
                        <span className="truncate max-w-[150px]">{lead.name}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[150px]">{lead.email}</span>
                        <span className="text-xs text-muted-foreground font-mono">{lead.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell p-3">
                      <div className="flex flex-col">
                        <span className="text-sm truncate max-w-[180px]">{lead.product}</span>
                        <span className="text-xs font-semibold text-primary">{lead.value}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell p-3">
                      <Badge variant="outline" className="text-[10px] uppercase">{lead.gateway}</Badge>
                    </TableCell>
                    <TableCell className="p-3 text-sm whitespace-nowrap text-muted-foreground">{lead.date}</TableCell>
                    <TableCell className="p-3">{getStatusBadge(lead.status)}</TableCell>
                    <TableCell className="hidden xl:table-cell p-3 text-xs text-muted-foreground">{lead.nextDispatch}</TableCell>
                    <TableCell className="text-right p-3">
                       <Dialog>
                         <DialogTrigger render={<Button variant="ghost" size="sm" className="h-8 gap-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-primary hover:text-primary hover:bg-primary/10" />}>
                           Histórico <ExternalLink className="w-3 h-3"/>
                         </DialogTrigger>
                         <DialogContent className="sm:max-w-[550px]">
                           <DialogHeader>
                             <DialogTitle className="flex items-center gap-2">Detalhes: {lead.name}</DialogTitle>
                             <DialogDescription>
                               Jornada completa do evento e fluxo de atendimento.
                             </DialogDescription>
                           </DialogHeader>
                           
                           <Tabs defaultValue="history" className="w-full mt-2">
                             <TabsList className="grid w-full grid-cols-2">
                               <TabsTrigger value="history">Timeline do Funil</TabsTrigger>
                               <TabsTrigger value="webhook">Dados Técnicos (Webhook)</TabsTrigger>
                             </TabsList>
                             
                             <TabsContent value="history" className="py-2 mt-4 space-y-4 relative min-h-[250px]">
                               <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-border/50" />
                               {lead.history.map((hist: any, idx: number) => (
                                 <div key={idx} className="flex gap-4 items-start relative z-10">
                                   <div className="w-8 h-8 rounded-full bg-background border flex items-center justify-center shrink-0">
                                     <History className="w-4 h-4 text-muted-foreground" />
                                   </div>
                                   <div className="flex flex-col pt-1">
                                      <span className="text-sm font-medium">{hist.title}</span>
                                      <span className="text-xs text-muted-foreground">{hist.date}</span>
                                   </div>
                                 </div>
                               ))}
                               {lead.status === "CONVERTED" && (
                                  <div className="flex gap-4 items-start relative z-10 pt-4">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                                      <Check className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <div className="flex flex-col pt-1">
                                       <span className="text-sm font-semibold text-emerald-500">Objetivo Atingido!</span>
                                       <span className="text-xs text-emerald-500/70">A automação detectou a conclusão com sucesso.</span>
                                    </div>
                                  </div>
                               )}
                             </TabsContent>

                             <TabsContent value="webhook" className="py-2 mt-4 min-h-[250px]">
                               <div className="space-y-4">
                                 <div className="grid grid-cols-2 gap-4">
                                   <div className="space-y-1">
                                     <p className="text-xs text-muted-foreground uppercase font-semibold">Produto Capturado</p>
                                     <p className="text-sm font-medium truncate">{lead.product}</p>
                                   </div>
                                   <div className="space-y-1">
                                     <p className="text-xs text-muted-foreground uppercase font-semibold">Valor</p>
                                     <p className="text-sm font-medium">{lead.value}</p>
                                   </div>
                                 </div>
                                 <div className="bg-muted/30 p-4 rounded-md border border-border/50 text-xs overflow-x-auto relative mt-4 shadow-inner">
                                   <div className="absolute top-2 right-2 flex px-2 py-0.5 bg-background border border-border text-[10px] rounded text-muted-foreground">JSON</div>
                                   <pre className="font-mono text-muted-foreground mt-2">{JSON.stringify(lead.webhookData, null, 2)}</pre>
                                 </div>
                               </div>
                             </TabsContent>
                           </Tabs>
                         </DialogContent>
                       </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
