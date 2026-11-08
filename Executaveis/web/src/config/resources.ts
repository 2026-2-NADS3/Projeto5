import type { ResourceProps } from "@refinedev/core";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ChartColumnBig,
  MessageSquare,
  QrCode,
  Users,
} from "lucide-react";

/**
 * As 5 áreas do menu lateral (seção 3 do documento de implementação).
 * A ordem aqui é a ordem do menu.
 */
export interface MetaRecurso {
  label: string;
  Icone: LucideIcon; // "icon" é reservado pelo Refine (espera ReactNode)
  descricao: string;
}

export const resources: (ResourceProps & { meta: MetaRecurso })[] = [
  {
    name: "dashboard",
    list: "/",
    meta: {
      label: "Dashboard",
      Icone: ChartColumnBig,
      descricao: "Indicadores de gestão e ranking dos alunos.",
    },
  },
  {
    name: "alunos",
    list: "/alunos",
    show: "/alunos/:id",
    meta: {
      label: "Alunos",
      Icone: Users,
      descricao: "Consulta dos alunos inscritos, faltas, bloqueios e certificados.",
    },
  },
  {
    name: "palestras",
    list: "/palestras",
    create: "/palestras/nova",
    edit: "/palestras/:id/editar",
    show: "/palestras/:id",
    meta: {
      label: "Palestras",
      Icone: CalendarDays,
      descricao: "Cadastro de palestras, inscritos, presença, grupos DISC e certificados.",
    },
  },
  {
    name: "checkin",
    list: "/checkin",
    meta: {
      label: "Check-in",
      Icone: QrCode,
      descricao: "Leitura do QR Code do convite do aluno pela câmera do celular.",
    },
  },
  {
    name: "comunicacao",
    list: "/comunicacao",
    meta: {
      label: "Comunicação",
      Icone: MessageSquare,
      descricao: "Mensagens, notificações e respostas às dúvidas dos alunos.",
    },
  },
];
