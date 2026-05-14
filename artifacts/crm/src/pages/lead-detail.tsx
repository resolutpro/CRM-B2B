import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetLead, useUpdateLead, useDeleteLead, useSuppressLead,
  useCreateTask, useUpdateTask,
  useCreateEmailDraft, useUpdateEmailDraft,
  useCreateContact, useUpdateContact, useDeleteContact,
  useCreateOutreachEvent,
  useCreateReply,
  getGetLeadQueryKey
} from "@workspace/api-client-react";
import type { LeadDetail, Contact, EmailDraft, OutreachEvent, Reply, Task } from "@workspace/api-client-react";
import {
  CRM_STATUS_LABELS, CRM_STATUS_COLORS, PRIORITY_COLORS, PRIORITY_LABELS,
  CONSENT_STATUS_LABELS, EMAIL_DRAFT_STATUS_LABELS, EMAIL_DRAFT_STATUS_COLORS,
  scoreColor, formatDate, ALL_CRM_STATUSES
} from "@/lib/utils";
import { ArrowLeft, Edit, Check, Ban, Phone, Mail, Globe, Instagram, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { LeadFormDialog } from "@/components/lead-form-dialog";

type SuppressionErrorData = { error?: string; detail?: string };
type ApiErrorLike = { status?: number; data?: SuppressionErrorData };

export default function LeadDetailPage() {
  const [, params] = useRoute("/leads/:id");
  const id = parseInt(params?.id ?? "0");
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("info");
  const [showEdit, setShowEdit] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showDraftForm, setShowDraftForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const { data: lead, isLoading } = useGetLead(id, {
    query: { enabled: !!id, queryKey: getGetLeadQueryKey(id) }
  });

  const updateMutation = useUpdateLead();
  const deleteMutation = useDeleteLead();
  const suppressMutation = useSuppressLead();

  const invalidate = () => qc.invalidateQueries({ queryKey: getGetLeadQueryKey(id) });

  const handleStatusChange = async (crmStatus: string) => {
    try {
      await updateMutation.mutateAsync({ id, data: { crmStatus } });
      toast({ title: "Estado actualizado" });
      invalidate();
    } catch (err) {
      const apiErr = err as ApiErrorLike;
      if (apiErr?.status === 422) {
        toast({
          title: "Lead bloqueado por supresión",
          description: apiErr.data?.detail ?? "Este email o dominio está en la lista de supresión.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Error al cambiar estado", variant: "destructive" });
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm("Eliminar este lead y todos sus datos?")) return;
    await deleteMutation.mutateAsync({ id });
    setLocation("/leads");
  };

  const handleSuppress = async () => {
    await suppressMutation.mutateAsync({ id });
    toast({ title: "Marcado como No contactar" });
    invalidate();
  };

  if (isLoading) return (
    <div className="p-8 flex justify-center">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!lead) return (
    <div className="p-8 text-center text-muted-foreground">Lead no encontrado</div>
  );

  const detail = lead as LeadDetail;

  const tabs = [
    { id: "info", label: "Informacion" },
    { id: "contacts", label: `Contactos (${detail.contacts?.length ?? 0})` },
    { id: "drafts", label: `Borradores (${detail.emailDrafts?.length ?? 0})` },
    { id: "events", label: `Eventos (${detail.outreachEvents?.length ?? 0})` },
    { id: "replies", label: `Respuestas (${detail.replies?.length ?? 0})` },
    { id: "tasks", label: `Tareas (${detail.tasks?.length ?? 0})` },
  ];

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/leads" className="p-1.5 rounded hover:bg-muted text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-foreground">{lead.businessName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{lead.businessType} · {lead.city}{lead.province ? `, ${lead.province}` : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${CRM_STATUS_COLORS[lead.crmStatus ?? ""] ?? "bg-muted"}`}>
            {CRM_STATUS_LABELS[lead.crmStatus ?? ""] ?? lead.crmStatus}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${PRIORITY_COLORS[lead.priority ?? ""] ?? "bg-muted"}`}>
            {PRIORITY_LABELS[lead.priority ?? ""] ?? lead.priority}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${scoreColor(lead.fitScore)}`}>
            Score: {lead.fitScore ?? "—"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          data-testid="button-edit"
          onClick={() => setShowEdit(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-input hover:bg-muted"
        >
          <Edit className="w-3.5 h-3.5" /> Editar
        </button>
        <button
          data-testid="button-approve"
          onClick={() => handleStatusChange("aprobado_para_contactar")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100"
        >
          <Check className="w-3.5 h-3.5" /> Aprobar
        </button>
        <button
          data-testid="button-mark-contacted"
          onClick={() => handleStatusChange("contactado")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100"
        >
          <Phone className="w-3.5 h-3.5" /> Contactado
        </button>
        <button
          data-testid="button-mark-interested"
          onClick={() => handleStatusChange("respondio_interesado")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
        >
          <Check className="w-3.5 h-3.5" /> Interesado
        </button>
        <button
          onClick={() => handleStatusChange("respondio_no_interesado")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100"
        >
          <X className="w-3.5 h-3.5" /> No interesado
        </button>
        <button
          data-testid="button-suppress"
          onClick={handleSuppress}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
        >
          <Ban className="w-3.5 h-3.5" /> No contactar
        </button>
        <button
          data-testid="button-create-task"
          onClick={() => { setActiveTab("tasks"); setShowTaskForm(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-input hover:bg-muted"
        >
          <Plus className="w-3.5 h-3.5" /> Tarea
        </button>
        <button
          data-testid="button-delete"
          onClick={handleDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-red-600 border border-red-200 hover:bg-red-50"
        >
          Eliminar
        </button>
      </div>

      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            data-testid={`tab-${t.id}`}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              activeTab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "info" && <InfoTab lead={detail} />}
      {activeTab === "contacts" && (
        <ContactsTab lead={detail} showForm={showContactForm} setShowForm={setShowContactForm} onSaved={invalidate} />
      )}
      {activeTab === "drafts" && (
        <DraftsTab lead={detail} showForm={showDraftForm} setShowForm={setShowDraftForm} onSaved={invalidate} />
      )}
      {activeTab === "events" && (
        <EventsTab lead={detail} showForm={showEventForm} setShowForm={setShowEventForm} onSaved={invalidate} />
      )}
      {activeTab === "replies" && (
        <RepliesTab lead={detail} showForm={showReplyForm} setShowForm={setShowReplyForm} onSaved={invalidate} />
      )}
      {activeTab === "tasks" && (
        <TasksTab lead={detail} showForm={showTaskForm} setShowForm={setShowTaskForm} onSaved={invalidate} />
      )}

      {showEdit && (
        <LeadFormDialog
          initial={lead}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); invalidate(); }}
        />
      )}
    </div>
  );
}

function InfoTab({ lead }: { lead: LeadDetail }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-card border border-card-border rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Datos del negocio</h3>
        <Field label="Nombre" value={lead.businessName} />
        <Field label="Tipo" value={lead.businessType} />
        <Field label="Ciudad" value={`${lead.city ?? ""}${lead.province ? `, ${lead.province}` : ""}${lead.country ? `, ${lead.country}` : ""}`} />
        <Field label="Email" value={lead.email} icon={<Mail className="w-3.5 h-3.5" />} />
        <Field label="Telefono" value={lead.phone} icon={<Phone className="w-3.5 h-3.5" />} />
        <Field label="Web" value={lead.website} icon={<Globe className="w-3.5 h-3.5" />} isLink />
        <Field label="Instagram" value={lead.instagram} icon={<Instagram className="w-3.5 h-3.5" />} />
      </div>
      <div className="bg-card border border-card-border rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Estado CRM</h3>
        <Field label="Estado" value={CRM_STATUS_LABELS[lead.crmStatus ?? ""] ?? lead.crmStatus ?? ""} />
        <Field label="Consentimiento" value={CONSENT_STATUS_LABELS[lead.consentStatus ?? ""] ?? lead.consentStatus ?? ""} />
        <Field label="Prioridad" value={PRIORITY_LABELS[lead.priority ?? ""] ?? lead.priority ?? ""} />
        <Field label="Asignado a" value={lead.assignedTo ?? ""} />
        <Field label="Ultimo contacto" value={formatDate(lead.lastContactedAt)} />
        <Field label="Proxima accion" value={formatDate(lead.nextActionAt)} />
        <Field label="Creado" value={formatDate(lead.createdAt)} />
        {lead.fitReason && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Motivo de encaje</div>
            <p className="text-sm text-foreground">{lead.fitReason}</p>
          </div>
        )}
        {lead.sourceNotes && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Notas de fuente</div>
            <p className="text-sm text-foreground">{lead.sourceNotes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, icon, isLink }: {
  label: string;
  value?: string | number | null;
  icon?: React.ReactNode;
  isLink?: boolean;
}) {
  if (!value) return null;
  const strValue = String(value);
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="text-muted-foreground mt-0.5 flex-shrink-0">{icon}</span>}
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        {isLink ? (
          <a href={strValue} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{strValue}</a>
        ) : (
          <div className="text-sm text-foreground">{strValue}</div>
        )}
      </div>
    </div>
  );
}

type TabProps = {
  lead: LeadDetail;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  onSaved: () => void;
};

function ContactsTab({ lead, showForm, setShowForm, onSaved }: TabProps) {
  const [form, setForm] = useState({ name: "", role: "", email: "", phone: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", role: "", email: "", phone: "" });
  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();
  const deleteMutation = useDeleteContact();
  const { toast } = useToast();

  const inputCls = "px-2.5 py-1 border border-input bg-background rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({ data: { leadId: lead.id, ...form } });
    toast({ title: "Contacto creado" });
    setForm({ name: "", role: "", email: "", phone: "" });
    setShowForm(false);
    onSaved();
  };

  const startEdit = (c: Contact) => {
    setEditingId(c.id);
    setEditForm({ name: c.name, role: c.role ?? "", email: c.email ?? "", phone: c.phone ?? "" });
  };

  const handleEdit = async (e: React.FormEvent, contactId: number) => {
    e.preventDefault();
    await updateMutation.mutateAsync({ id: contactId, data: editForm });
    toast({ title: "Contacto actualizado" });
    setEditingId(null);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-foreground">Contactos</h3>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
          <Plus className="w-3.5 h-3.5" /> Anadir
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleCreate} className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="Nombre *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={inputCls} />
            <input placeholder="Cargo" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className={inputCls} />
            <input placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className={inputCls} />
            <input placeholder="Telefono" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className={inputCls} />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg">Guardar</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm border border-input rounded-lg">Cancelar</button>
          </div>
        </form>
      )}
      {(lead.contacts?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground">No hay contactos asociados</p>
      ) : (
        <div className="space-y-2">
          {lead.contacts?.map((c: Contact) => (
            <div key={c.id} className="bg-card border border-card-border rounded-lg p-4">
              {editingId === c.id ? (
                <form onSubmit={e => handleEdit(e, c.id)} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input required placeholder="Nombre *" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
                    <input placeholder="Cargo" value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} className={inputCls} />
                    <input placeholder="Email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
                    <input placeholder="Telefono" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="px-2.5 py-1 text-xs bg-primary text-primary-foreground rounded-lg">Guardar</button>
                    <button type="button" onClick={() => setEditingId(null)} className="px-2.5 py-1 text-xs border border-input rounded-lg">Cancelar</button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-sm text-foreground">{c.name}</div>
                    {c.role && <div className="text-xs text-muted-foreground">{c.role}</div>}
                    <div className="flex gap-3 mt-1">
                      {c.email && <a href={`mailto:${c.email}`} className="text-xs text-primary hover:underline">{c.email}</a>}
                      {c.phone && <span className="text-xs text-muted-foreground">{c.phone}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(c)} className="p-1 rounded hover:bg-muted text-muted-foreground text-xs px-2">Editar</button>
                    <button onClick={async () => { await deleteMutation.mutateAsync({ id: c.id }); onSaved(); }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DraftsTab({ lead, showForm, setShowForm, onSaved }: TabProps) {
  const [form, setForm] = useState({ subject: "", body: "" });
  const createMutation = useCreateEmailDraft();
  const updateMutation = useUpdateEmailDraft();
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({ data: { leadId: lead.id, ...form, status: "borrador" } });
    toast({ title: "Borrador creado" });
    setForm({ subject: "", body: "" });
    setShowForm(false);
    onSaved();
  };

  const updateStatus = async (draftId: number, status: string) => {
    await updateMutation.mutateAsync({ id: draftId, data: { status } });
    toast({ title: "Estado actualizado" });
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-foreground">Borradores de email</h3>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
          <Plus className="w-3.5 h-3.5" /> Nuevo
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleCreate} className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
          <input required placeholder="Asunto *" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            className="w-full px-3 py-1.5 border border-input bg-background rounded-lg text-sm" />
          <textarea required placeholder="Cuerpo del email *" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            className="w-full px-3 py-1.5 border border-input bg-background rounded-lg text-sm h-32 resize-none" />
          <div className="flex gap-2">
            <button type="submit" className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg">Guardar</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm border border-input rounded-lg">Cancelar</button>
          </div>
        </form>
      )}
      {(lead.emailDrafts?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground">No hay borradores</p>
      ) : (
        <div className="space-y-3">
          {lead.emailDrafts?.map((d: EmailDraft) => (
            <div key={d.id} className="bg-card border border-card-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-sm text-foreground">{d.subject}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${EMAIL_DRAFT_STATUS_COLORS[d.status ?? ""] ?? "bg-muted"}`}>
                  {EMAIL_DRAFT_STATUS_LABELS[d.status ?? ""] ?? d.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">{d.body}</p>
              <div className="flex gap-2 mt-3">
                {d.status !== "aprobado" && (
                  <button onClick={() => updateStatus(d.id, "aprobado")} className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200 hover:bg-green-100">Aprobar</button>
                )}
                {d.status !== "rechazado" && (
                  <button onClick={() => updateStatus(d.id, "rechazado")} className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100">Rechazar</button>
                )}
                {d.status === "aprobado" && (
                  <button onClick={() => updateStatus(d.id, "enviado")} className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100">Marcar enviado</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventsTab({ lead, showForm, setShowForm, onSaved }: TabProps) {
  const [form, setForm] = useState({ channel: "email", direction: "outbound", subject: "", body: "" });
  const createMutation = useCreateOutreachEvent();
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({ data: { leadId: lead.id, ...form } });
    toast({ title: "Evento registrado" });
    setForm({ channel: "email", direction: "outbound", subject: "", body: "" });
    setShowForm(false);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-foreground">Eventos de contacto</h3>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
          <Plus className="w-3.5 h-3.5" /> Registrar evento
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleCreate} className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
          <div className="grid grid-cols-2 gap-3">
            <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
              className="px-3 py-1.5 border border-input bg-background rounded-lg text-sm">
              <option value="email">Email</option>
              <option value="telefono">Teléfono</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="otro">Otro</option>
            </select>
            <select value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value }))}
              className="px-3 py-1.5 border border-input bg-background rounded-lg text-sm">
              <option value="outbound">Saliente</option>
              <option value="inbound">Entrante</option>
            </select>
          </div>
          <input placeholder="Asunto (opcional)" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            className="w-full px-3 py-1.5 border border-input bg-background rounded-lg text-sm" />
          <textarea placeholder="Notas (opcional)" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            className="w-full px-3 py-1.5 border border-input bg-background rounded-lg text-sm h-20 resize-none" />
          <div className="flex gap-2">
            <button type="submit" className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg">Guardar</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm border border-input rounded-lg">Cancelar</button>
          </div>
        </form>
      )}
      {(lead.outreachEvents?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground">No hay eventos registrados</p>
      ) : (
        <div className="space-y-2">
          {lead.outreachEvents?.map((ev: OutreachEvent) => (
            <div key={ev.id} className="bg-card border border-card-border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{ev.channel}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{ev.direction}</span>
                <span className="text-xs text-muted-foreground ml-auto">{formatDate(ev.eventAt ?? ev.createdAt)}</span>
              </div>
              {ev.subject && <div className="text-sm font-medium text-foreground">{ev.subject}</div>}
              {ev.body && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ev.body}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RepliesTab({ lead, showForm, setShowForm, onSaved }: TabProps) {
  const [form, setForm] = useState({ fromEmail: "", body: "", intent: "", sentiment: "" });
  const createMutation = useCreateReply();
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({ data: {
      leadId: lead.id,
      body: form.body,
      fromEmail: form.fromEmail || undefined,
      intent: form.intent || undefined,
      sentiment: form.sentiment || undefined,
    } });
    toast({ title: "Respuesta registrada" });
    setForm({ fromEmail: "", body: "", intent: "", sentiment: "" });
    setShowForm(false);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-foreground">Respuestas recibidas</h3>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
          <Plus className="w-3.5 h-3.5" /> Registrar respuesta
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleCreate} className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Email remitente (opcional)" value={form.fromEmail} onChange={e => setForm(f => ({ ...f, fromEmail: e.target.value }))}
              className="px-3 py-1.5 border border-input bg-background rounded-lg text-sm" />
            <select value={form.intent} onChange={e => setForm(f => ({ ...f, intent: e.target.value }))}
              className="px-3 py-1.5 border border-input bg-background rounded-lg text-sm">
              <option value="">Intención (opcional)</option>
              <option value="interesado">Interesado</option>
              <option value="no_interesado">No interesado</option>
              <option value="solicita_info">Solicita información</option>
              <option value="baja">Solicita baja</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <select value={form.sentiment} onChange={e => setForm(f => ({ ...f, sentiment: e.target.value }))}
            className="w-full px-3 py-1.5 border border-input bg-background rounded-lg text-sm">
            <option value="">Sentimiento (opcional)</option>
            <option value="positivo">Positivo</option>
            <option value="neutro">Neutro</option>
            <option value="negativo">Negativo</option>
          </select>
          <textarea required placeholder="Contenido de la respuesta *" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            className="w-full px-3 py-1.5 border border-input bg-background rounded-lg text-sm h-24 resize-none" />
          <div className="flex gap-2">
            <button type="submit" className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg">Guardar</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm border border-input rounded-lg">Cancelar</button>
          </div>
        </form>
      )}
      {(lead.replies?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground">No hay respuestas registradas</p>
      ) : (
        <div className="space-y-2">
          {lead.replies?.map((r: Reply) => (
            <div key={r.id} className="bg-card border border-card-border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-1">
                {r.intent && <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{r.intent}</span>}
                {r.sentiment && <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{r.sentiment}</span>}
                <span className="text-xs text-muted-foreground ml-auto">{formatDate(r.receivedAt ?? r.createdAt)}</span>
              </div>
              {r.fromEmail && <div className="text-xs text-muted-foreground mb-1">De: {r.fromEmail}</div>}
              <p className="text-sm text-foreground">{r.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TasksTab({ lead, showForm, setShowForm, onSaved }: TabProps) {
  const [form, setForm] = useState({ title: "", taskType: "otro", dueDate: "", description: "" });
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({ data: { leadId: lead.id, ...form, status: "pendiente" } });
    toast({ title: "Tarea creada" });
    setForm({ title: "", taskType: "otro", dueDate: "", description: "" });
    setShowForm(false);
    onSaved();
  };

  const toggleStatus = async (taskId: number, status: string | null | undefined) => {
    const newStatus = status === "completada" ? "pendiente" : "completada";
    await updateMutation.mutateAsync({ id: taskId, data: { status: newStatus } });
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-foreground">Tareas</h3>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
          <Plus className="w-3.5 h-3.5" /> Nueva tarea
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleCreate} className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
          <input required placeholder="Titulo *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full px-3 py-1.5 border border-input bg-background rounded-lg text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.taskType} onChange={e => setForm(f => ({ ...f, taskType: e.target.value }))}
              className="px-3 py-1.5 border border-input bg-background rounded-lg text-sm">
              <option value="llamar">Llamar</option>
              <option value="enviar_email">Enviar email</option>
              <option value="seguimiento">Seguimiento</option>
              <option value="enviar_catalogo">Enviar catalogo</option>
              <option value="enviar_muestra">Enviar muestra</option>
              <option value="revisar">Revisar</option>
              <option value="otro">Otro</option>
            </select>
            <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              className="px-3 py-1.5 border border-input bg-background rounded-lg text-sm" />
          </div>
          <textarea placeholder="Descripcion (opcional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full px-3 py-1.5 border border-input bg-background rounded-lg text-sm h-20 resize-none" />
          <div className="flex gap-2">
            <button type="submit" className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg">Guardar</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm border border-input rounded-lg">Cancelar</button>
          </div>
        </form>
      )}
      {(lead.tasks?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground">No hay tareas pendientes</p>
      ) : (
        <div className="space-y-2">
          {lead.tasks?.map((t: Task) => (
            <div key={t.id} className={`bg-card border border-card-border rounded-lg p-4 flex items-start gap-3 ${t.status === "completada" ? "opacity-60" : ""}`}>
              <button onClick={() => toggleStatus(t.id, t.status)} className={`w-4 h-4 mt-0.5 rounded border flex-shrink-0 flex items-center justify-center ${t.status === "completada" ? "bg-primary border-primary" : "border-input"}`}>
                {t.status === "completada" && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
              </button>
              <div className="flex-1">
                <div className={`text-sm font-medium ${t.status === "completada" ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.title}</div>
                {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                <div className="flex gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{t.taskType}</span>
                  {t.dueDate && <span className="text-xs text-muted-foreground">Vence: {formatDate(t.dueDate)}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
