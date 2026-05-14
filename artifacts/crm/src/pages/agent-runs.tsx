import { useGetAgentRuns, getGetAgentRunsQueryKey } from "@workspace/api-client-react";
import { formatDate } from "@/lib/utils";

const RUN_STATUS_COLORS: Record<string, string> = {
  started: "bg-blue-100 text-blue-700",
  running: "bg-cyan-100 text-cyan-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  partial: "bg-yellow-100 text-yellow-700",
};

export default function AgentRunsPage() {
  const params = { limit: 100 };
  const { data: runs, isLoading } = useGetAgentRuns(params, {
    query: { queryKey: getGetAgentRunsQueryKey(params) }
  });

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Logs del agente</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Historial de ejecuciones del agente OpenClaw</p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (runs?.length ?? 0) === 0 ? (
        <div className="bg-card border border-card-border rounded-xl p-12 text-center">
          <p className="text-muted-foreground text-sm">No hay ejecuciones registradas del agente</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Las ejecuciones del agente OpenClaw apareceran aqui</p>
        </div>
      ) : (
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Agente</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Inicio</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fin</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Resumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {runs?.map(run => (
                <tr key={run.id} data-testid={`row-run-${run.id}`} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium text-foreground">{run.agentName}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{run.runType}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RUN_STATUS_COLORS[run.status ?? ""] ?? "bg-muted text-muted-foreground"}`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(run.startedAt)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(run.finishedAt)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{run.summary || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
