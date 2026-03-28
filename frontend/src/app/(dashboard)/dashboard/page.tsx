"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { MessageCircle, Mail, RotateCw, Activity, CheckCircle2, Webhook, RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('http://localhost:3333/api/analytics');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // 30s
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !data) {
    return (
      <div className="flex justify-center items-center h-[60vh] flex-col gap-4">
         <Activity className="h-8 w-8 text-primary animate-spin" />
         <p className="text-muted-foreground text-sm font-medium animate-pulse">Calculando Biometria Financeira...</p>
      </div>
    );
  }

  const { metrics, chartData, funnel, activities, revenue } = data;

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Central</h1>
          <p className="text-muted-foreground">Visão geral e tempo real da sua operação de recuperação.</p>
        </div>
        <Button onClick={fetchDashboardData} disabled={isRefreshing} variant="outline" size="sm" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Buscando..." : "Atualizar Dados"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks Recebidos</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.webhooks || 0}</div>
            <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WhatsApp Enviados</CardTitle>
            <MessageCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.whatsappSent || 0}</div>
            <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">E-mails Disparados</CardTitle>
            <Mail className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.emailsSent || 0}</div>
            <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência (Estimada)</CardTitle>
            <RotateCw className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{metrics?.recoveryRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Conversão vs Abandonos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-card/50 backdrop-blur-sm border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Visão Geral (Últimos 7 dias)</CardTitle>
            <CardDescription>Eventos processados cruzando o Gateway com a Máquina de Geração de Lucros.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData || []}>
                <defs>
                  <linearGradient id="colorWebhooks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMsgs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEmails" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'currentColor' }} stroke="currentColor" axisLine={false} tickLine={false} />
                <YAxis className="text-xs" tick={{ fill: 'currentColor' }} stroke="currentColor" axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" name="Webhooks" dataKey="webhooks" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorWebhooks)" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0 }} />
                <Area type="monotone" name="WhatsApp" dataKey="msgs" stroke="#22c55e" fillOpacity={1} fill="url(#colorMsgs)" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0 }} />
                <Area type="monotone" name="E-mails" dataKey="emails" stroke="#3b82f6" fillOpacity={1} fill="url(#colorEmails)" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3 bg-card/50 backdrop-blur-sm border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary animate-pulse" />
              Radar em Tempo Real
            </CardTitle>
            <CardDescription>Últimos sinais varridos pelo satélite do sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            {activities?.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity: any, idx: number) => {
                  let Icon = Webhook;
                  if (activity.type === 'whatsapp') Icon = MessageCircle;
                  if (activity.type === 'email') Icon = Mail;
                  if (activity.type === 'conversion') Icon = CheckCircle2;
                  
                  return (
                    <div key={idx} className="flex items-start gap-4 rounded-lg p-2 hover:bg-muted/50 transition-colors">
                      <div className={`mt-0.5 p-2 rounded-full bg-background border border-border shrink-0 ${activity.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1 overflow-hidden">
                        <p className="text-sm font-medium leading-none truncate">{activity.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate uppercase font-mono tracking-wider">{activity.subtitle}</p>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap bg-muted px-1.5 rounded">{activity.time}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
                <div className="text-xs text-muted-foreground py-10 flex flex-col items-center justify-center border border-dashed rounded bg-muted/20">
                   <Activity className="h-8 w-8 mb-2 opacity-50" />
                   Nenhum sinal capturado ainda.
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
        <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
           Raio-X do Funil
           <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded uppercase align-middle">Estimativa Node.js</span>
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card/40 border-border/50 shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />
            <CardHeader className="py-4">
              <CardDescription>Eventos Brutos</CardDescription>
              <CardTitle className="text-2xl">{funnel?.total || 0}</CardTitle>
            </CardHeader>
            <CardContent className="py-0 pb-4 text-xs text-muted-foreground">
              <div className="flex justify-between items-center mb-1">
                <span>Pagamentos Diretos:</span>
                <div className="flex items-center gap-2">
                   <span className="font-medium text-foreground">{funnel?.paidOrganically || 0}</span>
                   <span className="text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded text-[10px]">{formatBRL(revenue?.organically)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Passíveis de Recuperação:</span>
                <span className="font-medium text-amber-500">{funnel?.enteredRecovery || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/50 shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
            <CardHeader className="py-4">
              <CardDescription>Resgates Sucedidos</CardDescription>
              <div className="flex items-baseline gap-2">
                 <CardTitle className="text-2xl text-emerald-500">{funnel?.recoveredWpp || 0}</CardTitle>
                 <span className="text-sm font-medium text-emerald-500/80">{formatBRL(revenue?.recovered)}</span>
              </div>
            </CardHeader>
            <CardContent className="py-0 pb-4 text-xs text-muted-foreground">
              <div className="flex justify-between items-center mb-1">
                <span>Estimação de conversões derivadas das ferramentas de Tracking.</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/50 shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
            <CardHeader className="py-4">
              <CardDescription>Custo Perdido (Sangria)</CardDescription>
              <div className="flex items-baseline gap-2">
                 <CardTitle className="text-2xl text-red-500">{funnel?.lost || 0}</CardTitle>
                 <span className="text-sm font-medium text-red-500/80">{formatBRL(revenue?.lost)}</span>
              </div>
            </CardHeader>
            <CardContent className="py-0 pb-4 text-xs text-muted-foreground">
              <span>Leads que ignoraram o funil inteiro de escassez da Automação.</span>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/50 shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
            <CardHeader className="py-4">
              <CardDescription>Upsells Injetados</CardDescription>
              <CardTitle className="text-2xl">{funnel?.upsellSent || 0}</CardTitle>
            </CardHeader>
            <CardContent className="py-0 pb-4 text-xs text-muted-foreground">
              <div className="flex justify-between items-center">
                <span>Tique extra:</span>
                <span className="font-medium text-blue-500">Feature Lock</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
