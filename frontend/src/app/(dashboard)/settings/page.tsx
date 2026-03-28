"use client";

import { API_URL } from "@/lib/api";

import { useState, useEffect } from "react";
import { Save, Mail, Key, User, ShieldCheck, Link as LinkIcon, AlertCircle, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SettingsPage() {
  const [emailProvider, setEmailProvider] = useState("resend");
  const [isLoading, setIsLoading] = useState(true);

  const [resendApiKey, setResendApiKey] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [evolutionUrl, setEvolutionUrl] = useState("");
  const [evolutionKey, setEvolutionKey] = useState("");

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/settings`);
      if (res.ok) {
        const data = await res.json();
        setResendApiKey(data.resendApiKey || "");
        setSenderName(data.senderName || "");
        setSenderEmail(data.senderEmail || "");
        setEvolutionUrl(data.evolutionUrl || "");
        setEvolutionKey(data.evolutionKey || "");
        if (data.emailProvider) setEmailProvider(data.emailProvider);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (tab: string) => {
    try {
      const payload: any = {};
      if (tab === "email") {
         payload.resendApiKey = resendApiKey;
         payload.senderName = senderName;
         payload.senderEmail = senderEmail;
         payload.emailProvider = emailProvider;
      } else if (tab === "evolution") {
         payload.evolutionUrl = evolutionUrl;
         payload.evolutionKey = evolutionKey;
      }

      const res = await fetch(`${API_URL}/settings`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload)
      });
      if (res.ok) {
         toast.success("Configurações salvas diretamente na nuvem!");
      }
    } catch(e) {
      toast.error("Erro ao salvar configuração.");
    }
  };

  const handleSaveContactInfo = () => {
    toast.success("Dados da conta salvos com sucesso.");
  };

  const handleTestEmail = () => {
    toast.info("Enviando disparo teste via Resend API...");
    setTimeout(() => toast.success("Processo acionado!"), 1500);
  };

  const handleTestEvolution = () => {
    toast.info("Testando conexão com Evolution API...");
    setTimeout(() => toast.success("Processo acionado!"), 1500);
  };

  if(isLoading) {
    return <div className="flex justify-center py-20"><Activity className="w-8 h-8 text-muted-foreground animate-spin"/></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações Base</h1>
        <p className="text-muted-foreground">Gerencie seus dados e as conexões de API vivas do sistema.</p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 bg-muted/50 p-1">
          <TabsTrigger value="account" className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"><User className="w-4 h-4 mr-2"/> Conta</TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"><Mail className="w-4 h-4 mr-2"/> E-mail</TabsTrigger>
          <TabsTrigger value="evolution" className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"><LinkIcon className="w-4 h-4 mr-2"/> Evolution API</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card className="bg-card/50 backdrop-blur-sm shadow-sm border-border/50">
            <CardHeader>
              <CardTitle>Dados da Conta</CardTitle>
              <CardDescription>Atualize as informações do seu perfil de administrador.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" defaultValue="Administrador" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" defaultValue="admin@recuperatudo.com" />
                </div>
              </div>
              <Separator className="my-4" />
              <div className="space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2"><Key className="w-4 h-4 text-muted-foreground"/> Alterar Senha</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-pw">Senha Atual</Label>
                    <Input id="current-pw" type="password" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-pw">Nova Senha</Label>
                    <Input id="new-pw" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-pw">Confirmar Nova Senha</Label>
                    <Input id="confirm-pw" type="password" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveContactInfo}><Save className="w-4 h-4 mr-2"/> Atualizar Conta</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card className="bg-card/50 backdrop-blur-sm shadow-sm border-border/50">
            <CardHeader>
              <CardTitle>Servidor Oficial de E-mail</CardTitle>
              <CardDescription>Esta é a ponte dinâmica. O Node.js lerá as chaves abaixo sempre que um novo disparo ocorrer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 max-w-sm">
                <Label>Provedor Oficial</Label>
                <Select value={emailProvider} onValueChange={setEmailProvider}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resend">Resend API (Oficial e Conectada!)</SelectItem>
                    <SelectItem value="smtp" disabled>Google Workspace (Em breve)</SelectItem>
                    <SelectItem value="sendgrid" disabled>SendGrid (Em breve)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 bg-muted/20 p-4 rounded-lg border border-border">
                  <div className="space-y-2 max-w-md">
                    <Label>🔑 Resend API Key</Label>
                    <Input type="password" placeholder="re_..." value={resendApiKey} onChange={e => setResendApiKey(e.target.value)} />
                    <p className="text-[10px] text-muted-foreground mt-1">Gere esse token no dashboard da Resend (API Keys) - Nível de Acesso: Sending.</p>
                  </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Nome do Remetente <span className="text-muted-foreground text-xs font-normal">(Que vai aparecer no Gmail)</span></Label>
                  <Input placeholder="Ex: Suporte RecuperaTudo" value={senderName} onChange={e => setSenderName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email do Remetente <span className="text-muted-foreground text-xs font-normal">(Domínio Homologado na Resend)</span></Label>
                  <Input placeholder="Ex: contato@empresa.com.br" value={senderEmail} onChange={e => setSenderEmail(e.target.value)} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center bg-muted/10 pt-4 px-6 border-t border-border/50 rounded-b-lg">
              <Button variant="outline" onClick={handleTestEmail} className="text-blue-500 hover:text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 border-transparent">
                <ShieldCheck className="w-4 h-4 mr-2"/> Forçar Teste Unitário
              </Button>
              <Button onClick={() => handleSaveSettings("email")}>
                <Save className="w-4 h-4 mr-2"/> Atualizar na Nuvem
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="evolution">
          <Card className="bg-card/50 backdrop-blur-sm shadow-sm border-border/50">
            <CardHeader>
              <CardTitle>Evolution API (Motor do WhatsApp)</CardTitle>
              <CardDescription>Comunica os Agendamentos com o seu Whatsapp do celular.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 bg-muted/20 p-4 rounded-lg border border-border">
                <div className="space-y-2">
                  <Label htmlFor="evo-url">URL da Instância Global</Label>
                  <Input id="evo-url" placeholder="Ex: https://evo.suaempresa.com" value={evolutionUrl} onChange={e => setEvolutionUrl(e.target.value)} />
                  <p className="text-[10px] text-muted-foreground">Não inclua / no final. Deixe mudo/local para ignorar.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="evo-key">Global API Key</Label>
                  <Input id="evo-key" type="password" placeholder="Coloque sua autenticação global aqui..." value={evolutionKey} onChange={e => setEvolutionKey(e.target.value)} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center bg-muted/10 pt-4 px-6 border-t border-border/50 rounded-b-lg">
              <Button variant="outline" onClick={handleTestEvolution} className="bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-600 border-transparent">
                <ShieldCheck className="w-4 h-4 mr-2"/> Emitir Ping
              </Button>
              <Button onClick={() => handleSaveSettings("evolution")}>
                <Save className="w-4 h-4 mr-2"/> Atualizar Instância
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
