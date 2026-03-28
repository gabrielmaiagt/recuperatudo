"use client";

import { useState } from "react";
import { Plus, Smartphone, QrCode, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Mock Data
const mockInstances = [
  { id: "1", name: "Número Principal", phone: "+55 71 9999-8888", status: "CONNECTED", messagesSent: 1240 },
  { id: "2", name: "Suporte Vendas", phone: "+55 11 9888-7777", status: "WAITING_QR", messagesSent: 0 },
  { id: "3", name: "Recuperação Extra", phone: "+55 21 9777-6666", status: "DISCONNECTED", messagesSent: 450 },
];

export default function WhatsAppPage() {
  const [instances, setInstances] = useState(mockInstances);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState("");
  const [showQrCode, setShowQrCode] = useState(false);

  const handleAddInstance = () => {
    if (!newInstanceName.trim()) {
      toast.error("O nome da instância é obrigatório.");
      return;
    }
    // Simulate API Call -> returns QR Code
    setShowQrCode(true);
    toast.success("Instância criada! Escaneie o QR Code.");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONNECTED":
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Conectado</Badge>;
      case "WAITING_QR":
        return <Badge variant="outline" className="text-amber-500 border-amber-500/50 bg-amber-500/5">Aguardando QR</Badge>;
      case "DISCONNECTED":
        return <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20">Desconectado</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp</h1>
          <p className="text-muted-foreground">Gerencie seus números conectados e scaneie novos QR Codes.</p>
        </div>

        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger render={<Button className="gap-2 shrink-0" />}>
            <Plus className="h-4 w-4" />
            Adicionar Instância
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Instância</DialogTitle>
              <DialogDescription>
                Crie uma nova conexão WhatsApp para envio de mensagens.
              </DialogDescription>
            </DialogHeader>
            {!showQrCode ? (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome da Instância</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Suporte Recuperação"
                    value={newInstanceName}
                    onChange={(e) => setNewInstanceName(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 space-y-4">
                <div className="w-48 h-48 bg-white p-2 rounded-lg flex items-center justify-center border-2 border-dashed border-muted">
                  {/* Placeholder QR Code */}
                  <QrCode className="w-16 h-16 text-muted-foreground/50" />
                  <span className="sr-only">QR Code de Exemplo</span>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Abra o WhatsApp, vá em Aparelhos Conectados e escaneie este código.
                  Ele atualiza a cada 30 segundos.
                </p>
              </div>
            )}
            <DialogFooter>
              {!showQrCode ? (
                <Button onClick={handleAddInstance}>Gerar QR Code</Button>
              ) : (
                <Button variant="outline" onClick={() => { setIsAddModalOpen(false); setShowQrCode(false); setNewInstanceName(""); }}>
                  Fechar
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {instances.map((instance) => (
          <Card key={instance.id} className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    {instance.name}
                  </CardTitle>
                  <CardDescription className="font-mono">{instance.phone}</CardDescription>
                </div>
                {getStatusBadge(instance.status)}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Mensagens enviadas</span>
                  <span className="font-medium">{instance.messagesSent}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2 gap-2 flex-wrap">
              {instance.status === "CONNECTED" && (
                <Button variant="destructive" size="sm" className="w-full gap-2 bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20">
                  <PowerOff className="h-4 w-4" /> Desconectar
                </Button>
              )}
              {(instance.status === "DISCONNECTED" || instance.status === "WAITING_QR") && (
                <Button variant="secondary" size="sm" className="w-full gap-2">
                  <QrCode className="h-4 w-4" /> Ver QR Code
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
