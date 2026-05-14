import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { Layout } from "@/components/layout";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import LeadsPage from "@/pages/leads";
import LeadDetailPage from "@/pages/lead-detail";
import EmailDraftsPage from "@/pages/email-drafts";
import TasksPage from "@/pages/tasks";
import SuppressionPage from "@/pages/suppression";
import SettingsPage from "@/pages/settings";
import AgentRunsPage from "@/pages/agent-runs";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AppRoutes() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <Layout><DashboardPage /></Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/leads/:id">
        <ProtectedRoute>
          <Layout><LeadDetailPage /></Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/leads">
        <ProtectedRoute>
          <Layout><LeadsPage /></Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/email-drafts">
        <ProtectedRoute>
          <Layout><EmailDraftsPage /></Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/tasks">
        <ProtectedRoute>
          <Layout><TasksPage /></Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/suppression">
        <ProtectedRoute>
          <Layout><SuppressionPage /></Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Layout><SettingsPage /></Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/agent-runs">
        <ProtectedRoute>
          <Layout><AgentRunsPage /></Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppRoutes />
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
