import { Link } from "wouter";
import { useGetEmailDrafts, useUpdateEmailDraft, getGetEmailDraftsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { EMAIL_DRAFT_STATUS_LABELS, EMAIL_DRAFT_STATUS_COLORS, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const ALL_DRAFT_STATUSES = ["borrador", "pendiente_revision", "aprobado", "enviado", "rechazado"];

export default function EmailDraftsPage() {
  const [filterStatus, setFilterStatus] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();

  const params = {};
  const { data: drafts, isLoading } = useGetEmailDrafts(params, {
    query: { queryKey: getGetEmailDraftsQueryKey(params) }
  });

  const updateMutation = useUpdateEmailDraft();

  const filtered = (drafts ?? []).filter(d => !filterStatus || d.status === filterStatus);

  const updateStatus = async (id: number, status: string) => {
    await updateMutation.mutateAsync({ id, data: { status } });
    toast({ title: "Estado actualizado" });
    qc.invalidateQueries({ queryKey: getGetEmailDraftsQueryKey(params) });
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Borradores de email</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} borrador{filtered.length !== 1 ? "es" : ""}</p>
        </div>
        <select
          data-testid="select-status-filter"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-input bg-background rounded-lg text-sm"
        >
          <option value="">Todos los estados</option>
          {ALL_DRAFT_STATUSES.map(s => (
            <option key={s} value={s}>{EMAIL_DRAFT_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="p-8 text-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-card-border rounded-xl p-12 text-center">
          <p className="text-muted-foreground text-sm">No hay borradores</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(draft => (
            <div key={draft.id} data-testid={`card-draft-${draft.id}`} className="bg-card border border-card-border rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground text-sm">{draft.subject}</div>
                  {draft.leadId && (
                    <Link
                      href={`/leads/${draft.leadId}`}
                      className="text-xs text-primary hover:underline mt-0.5 inline-block"
                    >
                      Lead #{draft.leadId}
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${EMAIL_DRAFT_STATUS_COLORS[draft.status ?? ""] ?? "bg-muted"}`}>
                    {EMAIL_DRAFT_STATUS_LABELS[draft.status ?? ""] ?? draft.status}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(draft.createdAt)}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{draft.body}</p>
              <div className="flex gap-2 mt-3">
                {draft.status !== "aprobado" && draft.status !== "enviado" && (
                  <button
                    data-testid={`button-approve-${draft.id}`}
                    onClick={() => updateStatus(draft.id, "aprobado")}
                    className="text-xs px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                  >
                    Aprobar
                  </button>
                )}
                {draft.status !== "rechazado" && draft.status !== "enviado" && (
                  <button
                    data-testid={`button-reject-${draft.id}`}
                    onClick={() => updateStatus(draft.id, "rechazado")}
                    className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                  >
                    Rechazar
                  </button>
                )}
                {draft.status === "aprobado" && (
                  <button
                    data-testid={`button-sent-${draft.id}`}
                    onClick={() => updateStatus(draft.id, "enviado")}
                    className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                  >
                    Marcar enviado
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
