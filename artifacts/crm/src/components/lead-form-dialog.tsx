import { useState } from "react";
import { useCreateLead, useUpdateLead, getGetLeadsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { ALL_CRM_STATUSES, CRM_STATUS_LABELS } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Props {
  onClose: () => void;
  onSaved: () => void;
  initial?: any;
}

export function LeadFormDialog({ onClose, onSaved, initial }: Props) {
  const { toast } = useToast();
  const createMutation = useCreateLead();
  const updateMutation = useUpdateLead();

  const [form, setForm] = useState({
    businessName: initial?.businessName ?? "",
    businessType: initial?.businessType ?? "",
    city: initial?.city ?? "",
    province: initial?.province ?? "",
    country: initial?.country ?? "Espana",
    website: initial?.website ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    instagram: initial?.instagram ?? "",
    fitScore: initial?.fitScore?.toString() ?? "",
    fitReason: initial?.fitReason ?? "",
    consentStatus: initial?.consentStatus ?? "desconocido",
    crmStatus: initial?.crmStatus ?? "nuevo",
    priority: initial?.priority ?? "media",
    assignedTo: initial?.assignedTo ?? "",
    sourceNotes: initial?.sourceNotes ?? "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        fitScore: form.fitScore ? parseInt(form.fitScore) : undefined,
      };
      if (initial?.id) {
        await updateMutation.mutateAsync({ id: initial.id, data: payload });
        toast({ title: "Lead actualizado" });
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast({ title: "Lead creado" });
      }
      onSaved();
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    }
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );

  const inputCls = "w-full px-3 py-1.5 border border-input bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-card-border rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-card-border flex-shrink-0">
          <h2 className="font-semibold text-foreground">{initial?.id ? "Editar lead" : "Nuevo lead"}</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre empresa *">
              <input data-testid="input-businessName" className={inputCls} value={form.businessName} onChange={set("businessName")} required />
            </Field>
            <Field label="Tipo de negocio">
              <input data-testid="input-businessType" className={inputCls} value={form.businessType} onChange={set("businessType")} />
            </Field>
            <Field label="Ciudad">
              <input data-testid="input-city" className={inputCls} value={form.city} onChange={set("city")} />
            </Field>
            <Field label="Provincia">
              <input className={inputCls} value={form.province} onChange={set("province")} />
            </Field>
            <Field label="Pais">
              <input className={inputCls} value={form.country} onChange={set("country")} />
            </Field>
            <Field label="Web">
              <input className={inputCls} value={form.website} onChange={set("website")} type="url" />
            </Field>
            <Field label="Email">
              <input className={inputCls} value={form.email} onChange={set("email")} type="email" />
            </Field>
            <Field label="Telefono">
              <input className={inputCls} value={form.phone} onChange={set("phone")} />
            </Field>
            <Field label="Instagram">
              <input className={inputCls} value={form.instagram} onChange={set("instagram")} />
            </Field>
            <Field label="Score (0-100)">
              <input data-testid="input-fitScore" className={inputCls} value={form.fitScore} onChange={set("fitScore")} type="number" min={0} max={100} />
            </Field>
            <Field label="Estado CRM">
              <select data-testid="select-crmStatus" className={inputCls} value={form.crmStatus} onChange={set("crmStatus")}>
                {ALL_CRM_STATUSES.map(s => <option key={s} value={s}>{CRM_STATUS_LABELS[s]}</option>)}
              </select>
            </Field>
            <Field label="Prioridad">
              <select data-testid="select-priority" className={inputCls} value={form.priority} onChange={set("priority")}>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </Field>
            <Field label="Consentimiento">
              <select className={inputCls} value={form.consentStatus} onChange={set("consentStatus")}>
                <option value="desconocido">Desconocido</option>
                <option value="email_publico_corporativo">Email publico corporativo</option>
                <option value="contacto_manual_recomendado">Contacto manual recomendado</option>
                <option value="consentimiento_obtenido">Consentimiento obtenido</option>
                <option value="relacion_previa">Relacion previa</option>
                <option value="no_contactar">No contactar</option>
                <option value="baja_solicitada">Baja solicitada</option>
              </select>
            </Field>
            <Field label="Asignado a">
              <input className={inputCls} value={form.assignedTo} onChange={set("assignedTo")} />
            </Field>
          </div>
          <Field label="Motivo de encaje">
            <textarea className={`${inputCls} h-20 resize-none`} value={form.fitReason} onChange={set("fitReason")} />
          </Field>
          <Field label="Notas de fuente">
            <textarea className={`${inputCls} h-16 resize-none`} value={form.sourceNotes} onChange={set("sourceNotes")} />
          </Field>
        </form>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-card-border flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-input hover:bg-muted">Cancelar</button>
          <button
            data-testid="button-save-lead"
            onClick={(e) => { e.preventDefault(); handleSubmit(e as any); }}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {createMutation.isPending || updateMutation.isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
