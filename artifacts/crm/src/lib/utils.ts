import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CRM_STATUS_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  validado: "Validado",
  pendiente_revision: "Pendiente revision",
  pendiente_generar_borrador: "Pendiente generar borrador",
  email_preparado: "Email preparado",
  aprobado_para_contactar: "Aprobado",
  contactado: "Contactado",
  respondio_interesado: "Interesado",
  respondio_no_interesado: "No interesado",
  seguimiento: "Seguimiento",
  muestra_enviada: "Muestra enviada",
  negociacion: "Negociacion",
  cliente_ganado: "Cliente ganado",
  cliente_perdido: "Cliente perdido",
  no_contactar: "No contactar",
  descartado: "Descartado",
};

export const CRM_STATUS_COLORS: Record<string, string> = {
  nuevo: "bg-blue-100 text-blue-800",
  validado: "bg-indigo-100 text-indigo-800",
  pendiente_revision: "bg-yellow-100 text-yellow-800",
  pendiente_generar_borrador: "bg-fuchsia-100 text-fuchsia-800",
  email_preparado: "bg-purple-100 text-purple-800",
  aprobado_para_contactar: "bg-teal-100 text-teal-800",
  contactado: "bg-cyan-100 text-cyan-800",
  respondio_interesado: "bg-green-100 text-green-800",
  respondio_no_interesado: "bg-orange-100 text-orange-800",
  seguimiento: "bg-sky-100 text-sky-800",
  muestra_enviada: "bg-lime-100 text-lime-800",
  negociacion: "bg-violet-100 text-violet-800",
  cliente_ganado: "bg-emerald-100 text-emerald-800",
  cliente_perdido: "bg-red-100 text-red-800",
  no_contactar: "bg-red-200 text-red-900",
  descartado: "bg-gray-100 text-gray-600",
};

export const PRIORITY_COLORS: Record<string, string> = {
  alta: "bg-red-100 text-red-700",
  media: "bg-yellow-100 text-yellow-700",
  baja: "bg-gray-100 text-gray-600",
};

export const PRIORITY_LABELS: Record<string, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

export const CONSENT_STATUS_LABELS: Record<string, string> = {
  desconocido: "Desconocido",
  email_publico_corporativo: "Email publico",
  contacto_manual_recomendado: "Manual recomendado",
  consentimiento_obtenido: "Consentimiento obtenido",
  relacion_previa: "Relacion previa",
  no_contactar: "No contactar",
  baja_solicitada: "Baja solicitada",
};

export const EMAIL_DRAFT_STATUS_LABELS: Record<string, string> = {
  borrador: "Borrador",
  pendiente_revision: "Pendiente revision",
  aprobado: "Aprobado",
  enviado: "Enviado",
  rechazado: "Rechazado",
};

export const EMAIL_DRAFT_STATUS_COLORS: Record<string, string> = {
  borrador: "bg-gray-100 text-gray-600",
  pendiente_revision: "bg-yellow-100 text-yellow-700",
  aprobado: "bg-green-100 text-green-700",
  enviado: "bg-blue-100 text-blue-700",
  rechazado: "bg-red-100 text-red-700",
};

export function scoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return "bg-gray-100 text-gray-500";
  if (score >= 70) return "bg-green-100 text-green-700";
  if (score >= 40) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export const ALL_CRM_STATUSES = Object.keys(CRM_STATUS_LABELS);
