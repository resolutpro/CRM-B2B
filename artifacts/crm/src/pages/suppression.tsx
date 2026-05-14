import { useState } from "react";
import {
  useGetSuppression, useCreateSuppression, useDeleteSuppression,
  getGetSuppressionQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SuppressionPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", domain: "", reason: "" });

  const { data: list, isLoading } = useGetSuppression({ query: { queryKey: getGetSuppressionQueryKey() } });
  const createMutation = useCreateSuppression();
  const deleteMutation = useDeleteSuppression();

  const invalidate = () => qc.invalidateQueries({ queryKey: getGetSuppressionQueryKey() });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email && !form.domain) {
      toast({ title: "Introduce un email o dominio", variant: "destructive" });
      return;
    }
    await createMutation.mutateAsync({ data: form });
    toast({ title: "Entrada anadida a la lista de no contactar" });
    setForm({ email: "", domain: "", reason: "" });
    setShowForm(false);
    invalidate();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Eliminar esta entrada?")) return;
    await deleteMutation.mutateAsync({ id });
    toast({ title: "Entrada eliminada" });
    invalidate();
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Lista de no contactar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Emails y dominios que no deben recibir contacto comercial
          </p>
        </div>
        <button
          data-testid="button-add-suppression"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> Anadir
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-card border border-card-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Nueva entrada</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Email</label>
              <input
                data-testid="input-email"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="contacto@empresa.com"
                className="w-full px-3 py-2 border border-input bg-background rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Dominio</label>
              <input
                data-testid="input-domain"
                value={form.domain}
                onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
                placeholder="empresa.com"
                className="w-full px-3 py-2 border border-input bg-background rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Motivo</label>
              <input
                data-testid="input-reason"
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Baja solicitada, etc."
                className="w-full px-3 py-2 border border-input bg-background rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              data-testid="button-save-suppression"
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {createMutation.isPending ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm border border-input rounded-lg hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (list?.length ?? 0) === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground text-sm">La lista de no contactar esta vacia</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Dominio</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Motivo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Anadido</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list?.map(entry => (
                <tr key={entry.id} data-testid={`row-suppression-${entry.id}`} className="hover:bg-muted/20">
                  <td className="px-4 py-3 text-foreground">{entry.email || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.domain || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.reason || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(entry.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      data-testid={`button-delete-${entry.id}`}
                      onClick={() => handleDelete(entry.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
