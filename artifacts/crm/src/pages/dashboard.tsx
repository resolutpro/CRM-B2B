import { useGetDashboardStats, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CRM_STATUS_LABELS, CRM_STATUS_COLORS, formatDate } from "@/lib/utils";
import { Users, Mail, CheckSquare, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const { data: stats, isLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const keyStatuses = ["nuevo", "contactado", "respondio_interesado", "cliente_ganado", "descartado"];
  const statusData = stats?.byStatus ?? [];

  const totalByStatus = Object.fromEntries(statusData.map(s => [s.label, s.count]));

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Vision general de la prospección</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total leads"
          value={stats?.totalLeads ?? 0}
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          label="Pendientes de tareas"
          value={stats?.pendingTasks ?? 0}
          icon={<CheckSquare className="w-4 h-4" />}
        />
        <StatCard
          label="Tasa de respuesta"
          value={`${stats?.responseRate ?? 0}%`}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <StatCard
          label="Clientes ganados"
          value={totalByStatus["cliente_ganado"] ?? 0}
          icon={<Mail className="w-4 h-4" />}
          accent
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {keyStatuses.map(status => (
          <div key={status} className="bg-card border border-card-border rounded-xl p-4">
            <div className="text-2xl font-bold text-foreground">{totalByStatus[status] ?? 0}</div>
            <div className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${CRM_STATUS_COLORS[status]}`}>
              {CRM_STATUS_LABELS[status]}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Por tipo de negocio" data={stats?.byBusinessType ?? []} />
        <ChartCard title="Por ciudad" data={stats?.byCity ?? []} />
      </div>

      <div className="bg-card border border-card-border rounded-xl">
        <div className="px-6 py-4 border-b border-card-border">
          <h2 className="text-sm font-semibold text-foreground">Ultimos eventos de contacto</h2>
        </div>
        {(stats?.recentEvents ?? []).length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">No hay eventos registrados aun</div>
        ) : (
          <div className="divide-y divide-border">
            {(stats?.recentEvents ?? []).slice(0, 8).map((event: any) => (
              <div key={event.id} className="px-6 py-3 flex items-center gap-4">
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{event.channel}</span>
                <span className="text-sm text-foreground flex-1 truncate">{event.subject || "(sin asunto)"}</span>
                <span className="text-xs text-muted-foreground">{formatDate(event.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card border border-card-border rounded-xl">
        <div className="px-6 py-4 border-b border-card-border">
          <h2 className="text-sm font-semibold text-foreground">Leads por estado</h2>
        </div>
        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {statusData.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-lg font-bold text-foreground">{s.count}</div>
              <div className={`mt-1 text-xs px-2 py-0.5 rounded-full inline-block ${CRM_STATUS_COLORS[s.label] ?? "bg-muted text-muted-foreground"}`}>
                {CRM_STATUS_LABELS[s.label] ?? s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent = false }: { label: string; value: any; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`bg-card border border-card-border rounded-xl p-5 ${accent ? "border-primary/30 bg-primary/5" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <span className={`${accent ? "text-primary" : "text-muted-foreground"}`}>{icon}</span>
      </div>
      <div className={`text-3xl font-bold ${accent ? "text-primary" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#84cc16", "#f97316"];

function ChartCard({ title, data }: { title: string; data: { label: string; count: number }[] }) {
  const sorted = [...data].sort((a, b) => b.count - a.count).slice(0, 8);
  return (
    <div className="bg-card border border-card-border rounded-xl p-6">
      <h2 className="text-sm font-semibold text-foreground mb-4">{title}</h2>
      {sorted.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">Sin datos</div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={sorted} layout="vertical" margin={{ left: 8, right: 8 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="label" type="category" tick={{ fontSize: 11 }} width={100} />
            <Tooltip formatter={(v) => [v, "Leads"]} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {sorted.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
