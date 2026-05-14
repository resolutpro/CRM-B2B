import { useState } from "react";
import { Link } from "wouter";
import { useGetTasks, useUpdateTask, useDeleteTask, getGetTasksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";
import { Check, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TASK_STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completada: "Completada",
  cancelada: "Cancelada",
};

const TASK_STATUS_COLORS: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-700",
  en_progreso: "bg-blue-100 text-blue-700",
  completada: "bg-green-100 text-green-700",
  cancelada: "bg-gray-100 text-gray-500",
};

export default function TasksPage() {
  const [filterStatus, setFilterStatus] = useState("pendiente");
  const qc = useQueryClient();
  const { toast } = useToast();

  const params = { status: filterStatus || undefined };
  const { data: tasks, isLoading } = useGetTasks(params, {
    query: { queryKey: getGetTasksQueryKey(params) }
  });

  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  const invalidate = () => qc.invalidateQueries({ queryKey: getGetTasksQueryKey(params) });

  const handleComplete = async (id: number) => {
    await updateMutation.mutateAsync({ id, data: { status: "completada" } });
    toast({ title: "Tarea completada" });
    invalidate();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Eliminar esta tarea?")) return;
    await deleteMutation.mutateAsync({ id });
    toast({ title: "Tarea eliminada" });
    invalidate();
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tareas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{tasks?.length ?? 0} tarea{(tasks?.length ?? 0) !== 1 ? "s" : ""}</p>
        </div>
        <select
          data-testid="select-status-filter"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-input bg-background rounded-lg text-sm"
        >
          <option value="">Todos los estados</option>
          {Object.keys(TASK_STATUS_LABELS).map(s => (
            <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="p-8 text-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (tasks?.length ?? 0) === 0 ? (
        <div className="bg-card border border-card-border rounded-xl p-12 text-center">
          <p className="text-muted-foreground text-sm">No hay tareas pendientes</p>
        </div>
      ) : (
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-8"></th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tarea</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Lead</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vence</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tasks?.map(task => (
                <tr key={task.id} data-testid={`row-task-${task.id}`} className={`hover:bg-muted/20 transition-colors ${task.status === "completada" ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3">
                    <button
                      data-testid={`button-complete-${task.id}`}
                      onClick={() => handleComplete(task.id)}
                      disabled={task.status === "completada"}
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${task.status === "completada" ? "bg-primary border-primary" : "border-input hover:border-primary"}`}
                    >
                      {task.status === "completada" && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`font-medium ${task.status === "completada" ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</div>
                    {task.description && <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{task.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{task.taskType}</td>
                  <td className="px-4 py-3">
                    {task.leadId && (
                      <Link href={`/leads/${task.leadId}`}>
                        <a className="text-xs text-primary hover:underline">Lead #{task.leadId}</a>
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TASK_STATUS_COLORS[task.status ?? ""] ?? "bg-muted"}`}>
                      {TASK_STATUS_LABELS[task.status ?? ""] ?? task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(task.dueDate)}</td>
                  <td className="px-4 py-3">
                    <button
                      data-testid={`button-delete-${task.id}`}
                      onClick={() => handleDelete(task.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
