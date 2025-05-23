"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <Link href="/dashboard">
              <span className="text-xl">MeetingsTranscript</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/new">
              <Button>Nova Transcrição</Button>
            </Link>
            <button className="rounded-full h-8 w-8 bg-gray-200 flex items-center justify-center">
              <span className="font-medium text-sm">U</span>
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Suas Transcrições</h1>
            <Link href="/dashboard/new">
              <Button>Nova Transcrição</Button>
            </Link>
          </div>
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="file">Arquivos</TabsTrigger>
              <TabsTrigger value="youtube">YouTube</TabsTrigger>
              <TabsTrigger value="live">Ao vivo</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Link href="/dashboard/transcription/1">
                  <Card className="overflow-hidden hover:border-primary/50 transition-colors">
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg truncate">Reunião de Planejamento Trimestral</CardTitle>
                      <CardDescription>Arquivo - 10 minutos</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-gray-500 line-clamp-2">
                        Transcrição de reunião de planejamento para Q3 com equipe de marketing e vendas.
                      </p>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs text-gray-500">Completada</span>
                        <span className="text-xs text-gray-500">12/06/2023</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/dashboard/transcription/2">
                  <Card className="overflow-hidden hover:border-primary/50 transition-colors">
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg truncate">Tutorial de React - Curso Completo</CardTitle>
                      <CardDescription>YouTube - 45 minutos</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-gray-500 line-clamp-2">
                        Transcrição de tutorial completo de React do canal DevMaster.
                      </p>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs text-gray-500">Completada</span>
                        <span className="text-xs text-gray-500">07/05/2023</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              <div className="mt-8 text-center text-gray-500">
                <p>Você atingiu 2 de 10 transcrições no seu plano atual.</p>
                <Link href="/pricing">
                  <Button className="mt-4" variant="outline" size="sm">
                    Fazer Upgrade
                  </Button>
                </Link>
              </div>
            </TabsContent>
            
            <TabsContent value="file" className="mt-0">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Link href="/dashboard/transcription/1">
                  <Card className="overflow-hidden hover:border-primary/50 transition-colors">
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg truncate">Reunião de Planejamento Trimestral</CardTitle>
                      <CardDescription>Arquivo - 10 minutos</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-gray-500 line-clamp-2">
                        Transcrição de reunião de planejamento para Q3 com equipe de marketing e vendas.
                      </p>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs text-gray-500">Completada</span>
                        <span className="text-xs text-gray-500">12/06/2023</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </TabsContent>
            
            <TabsContent value="youtube" className="mt-0">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Link href="/dashboard/transcription/2">
                  <Card className="overflow-hidden hover:border-primary/50 transition-colors">
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg truncate">Tutorial de React - Curso Completo</CardTitle>
                      <CardDescription>YouTube - 45 minutos</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-gray-500 line-clamp-2">
                        Transcrição de tutorial completo de React do canal DevMaster.
                      </p>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs text-gray-500">Completada</span>
                        <span className="text-xs text-gray-500">07/05/2023</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </TabsContent>
            
            <TabsContent value="live" className="mt-0">
              <div className="text-center py-12">
                <p className="text-gray-500">Você ainda não tem transcrições ao vivo.</p>
                <Link href="/dashboard/new?type=live">
                  <Button className="mt-4">Criar Transcrição ao Vivo</Button>
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
} 