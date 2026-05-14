import { useState } from "react";
import { Link } from "wouter";
import {
  useGetLeads, useDeleteLead, useSuppressLead, useUpdateLead,
  getGetLeadsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CRM_STATUS_LABELS, CRM_STATUS_COLORS, PRIORITY_COLORS, PRIORITY_LABELS,
  ALL_CRM_STATUSES, scoreColor, formatDate
} from "@/lib/utils";
import { Search, Plus, ChevronLeft, ChevronRight, Trash2, Eye, Ban, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LeadFormDialog } from "@/components/lead-form-dialog";

export default function LeadsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [minScore, setMinScore] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const params = {
    query: query || undefined,
    status: status || undefined,
    priority: priority || undefined,
    minScore: minScore ? parseInt(minScore) : undefined,
    page,
    limit: 25,
  };

  const { data, isLoading } = useGetLeads(params, {
    query: { queryKey: getGetLeadsQueryKey(params) }
  });

  const deleteMutation = useDeleteLead();
  const suppressMutation = useSuppressLead();
  const approveMutation = useUpdateLead();

  const invalidate = () => qc.invalidateQueries({ queryKey: ["getLeads"] });

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Eliminar lead "${name}"?`)) return;
    await deleteMutation.mutateAsync({ id });
    toast({ title: "Lead eliminado" });
    invalidate();
  };

  const handleSuppress = async (id: number) => {
    await suppressMutation.mutateAsync({ id });
    toast({ title: "Lead marcado como No contactar" });
    invalidate();
  };

  const handleApprove = async (id: number) => {
    await approveMutation.mutateAsync({ id, data: { crmStatus: "aprobado_para_contactar" } });
    toast({ title: "Lead aprobado para contactar" });
    invalidate();
  };

  const leads = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 25);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total} lead{total !== 1 ? "s" : ""} en total</p>
        </div>
        <button
          data-testid="button-create-lead"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Nuevo lead
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            data-testid="input-search"
            type="search"
            placeholder="Buscar por nombre, ciudad, email..."
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 border border-input bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          data-testid="select-status"
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-input bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos los estados</option>
          {ALL_CRM_STATUSES.map(s => <option key={s} value={s}>{CRM_STATUS_LABELS[s]}</option>)}
        </select>
        <select
          data-testid="select-priority"
          value={priority}
          onChange={e => { setPriority(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-input bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Toda prioridad</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
        <input
          data-testid="input-min-score"
          type="number"
          placeholder="Score min"
          value={minScore}
          onChange={e => { setMinScore(e.target.value); setPage(1); }}
          className="w-28 px-3 py-2 border border-input bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          min={0} max={100}
        />
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground text-sm">No hay leads todavia</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Los leads creados por el agente o manualmente apareceran aqui</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Empresa</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ciudad</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Score</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Prioridad</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Creado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.map(lead => (
                <tr key={lead.id} data-testid={`row-lead-${lead.id}`} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/leads/${lead.id}`}>
                      <a className="font-medium text-foreground hover:text-primary transition-colors">{lead.businessName}</a>
                    </Link>
                    {lead.email && <div className="text-xs text-muted-foreground mt-0.5">{lead.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{lead.businessType || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{lead.city || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${scoreColor(lead.fitScore)}`}>
                      {lead.fitScore ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CRM_STATUS_COLORS[lead.crmStatus ?? ""] ?? "bg-muted text-muted-foreground"}`}>
                      {CRM_STATUS_LABELS[lead.crmStatus ?? ""] ?? lead.crmStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[lead.priority ?? ""] ?? "bg-muted text-muted-foreground"}`}>
                      {PRIORITY_LABELS[lead.priority ?? ""] ?? lead.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(lead.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link href={`/leads/${lead.id}`}>
                        <a data-testid={`button-view-${lead.id}`} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                      </Link>
                      <button
                        data-testid={`button-approve-${lead.id}`}
                        onClick={() => handleApprove(lead.id)}
                        className="p-1.5 rounded hover:bg-green-50 transition-colors text-muted-foreground hover:text-green-600"
                        title="Aprobar para contactar"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        data-testid={`button-suppress-${lead.id}`}
                        onClick={() => handleSuppress(lead.id)}
                        className="p-1.5 rounded hover:bg-orange-50 transition-colors text-muted-foreground hover:text-orange-600"
                        title="No contactar"
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                      <button
                        data-testid={`button-delete-${lead.id}`}
                        onClick={() => handleDelete(lead.id, lead.businessName)}
                        className="p-1.5 rounded hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Pagina {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-input disabled:opacity-40 hover:bg-muted"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded border border-input disabled:opacity-40 hover:bg-muted"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreate && <LeadFormDialog onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); invalidate(); }} />}
    </div>
  );
}
