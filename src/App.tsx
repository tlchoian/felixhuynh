import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import CredentialVault from "./pages/CredentialVault";
import ContractMonitor from "./pages/ContractMonitor";
import NetworkIPAM from "./pages/NetworkIPAM";
import TaskTracker from "./pages/TaskTracker";
import TechWiki from "./pages/TechWiki";
import ActivityLogs from "./pages/ActivityLogs";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/credentials" element={<CredentialVault />} />
                        <Route path="/contracts" element={<ContractMonitor />} />
                        <Route path="/network" element={<NetworkIPAM />} />
                        <Route path="/tasks" element={<TaskTracker />} />
                        <Route path="/wiki" element={<TechWiki />} />
                        <Route path="/activity-logs" element={<ActivityLogs />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
