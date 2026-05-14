import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Leaf } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
    } catch {
      toast({ title: "Error de acceso", description: "Usuario o contrasena incorrectos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-sidebar-primary flex items-center justify-center mb-4">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-sidebar-foreground">La Bercianita CRM</h1>
          <p className="text-sm text-sidebar-foreground/50 mt-1">Acceso al panel de gestion</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-xl p-6 shadow-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Usuario</label>
            <input
              data-testid="input-username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="admin"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Contrasena</label>
            <input
              data-testid="input-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>
          <button
            data-testid="button-submit"
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Accediendo..." : "Acceder"}
          </button>
        </form>
      </div>
    </div>
  );
}
