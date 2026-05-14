import { useState, useEffect } from "react";
import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const SETTING_DEFS = [
  { key: "sender_name", label: "Nombre del remitente", type: "text", placeholder: "La Bercianita" },
  { key: "sender_email", label: "Email del remitente", type: "email", placeholder: "info@labercianita.com" },
  { key: "phone", label: "Telefono de contacto", type: "text", placeholder: "+34 ..." },
  { key: "website", label: "Web de la marca", type: "url", placeholder: "https://www.labercianita.com/" },
  { key: "min_score", label: "Score minimo para contactar", type: "number", placeholder: "60" },
  { key: "daily_contact_limit", label: "Limite diario de contactos", type: "number", placeholder: "20" },
  { key: "target_cities", label: "Ciudades objetivo (JSON array)", type: "textarea", placeholder: '["Madrid","Barcelona"]' },
  { key: "target_business_types", label: "Tipos de negocio objetivo (JSON array)", type: "textarea", placeholder: '["tienda gourmet","delicatessen"]' },
];

export default function SettingsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data: settings, isLoading } = useGetSettings({ query: { queryKey: getGetSettingsQueryKey() } });
  const updateMutation = useUpdateSettings();

  useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {};
      for (const s of settings) {
        map[(s as any).key] = (s as any).value ?? "";
      }
      setForm(map);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMutation.mutateAsync({ data: form });
      toast({ title: "Configuracion guardada" });
      qc.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Configuracion</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Parametros del agente y datos de contacto de la marca</p>
      </div>

      <form onSubmit={handleSave} className="bg-card border border-card-border rounded-xl p-6 space-y-5">
        {SETTING_DEFS.map(def => (
          <div key={def.key}>
            <label className="block text-sm font-medium text-foreground mb-1.5">{def.label}</label>
            {def.type === "textarea" ? (
              <textarea
                data-testid={`input-${def.key}`}
                value={form[def.key] ?? ""}
                onChange={e => setForm(f => ({ ...f, [def.key]: e.target.value }))}
                placeholder={def.placeholder}
                rows={3}
                className="w-full px-3 py-2 border border-input bg-background rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring font-mono"
              />
            ) : (
              <input
                data-testid={`input-${def.key}`}
                type={def.type}
                value={form[def.key] ?? ""}
                onChange={e => setForm(f => ({ ...f, [def.key]: e.target.value }))}
                placeholder={def.placeholder}
                className="w-full px-3 py-2 border border-input bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          </div>
        ))}

        <div className="pt-2">
          <button
            data-testid="button-save"
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
