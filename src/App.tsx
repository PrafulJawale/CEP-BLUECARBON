import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { IoTProvider } from "@/contexts/IoTContext";
import { ForumProvider } from "@/contexts/ForumContext";
import { GameificationProvider } from "@/contexts/GameificationContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import DataUpload from "./pages/DataUpload";
import Registry from "./pages/Registry";
import Marketplace from "./pages/Marketplace";
import AdminPanel from "./pages/AdminPanel";
import CommunityPortal from "./pages/CommunityPortal";
import GISMapping from "./pages/GISMapping";
import IoTSimulation from "./pages/IoTSimulation";
import VerificationWorkflow from "./pages/VerificationWorkflow";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <NotificationProvider>
          <DataProvider>
            <IoTProvider>
              <ForumProvider>
                <GameificationProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <Routes>
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/upload" element={<DataUpload />} />
                      <Route path="/registry" element={<Registry />} />
                      <Route path="/marketplace" element={<Marketplace />} />
                      <Route path="/admin" element={<AdminPanel />} />
                      <Route path="/community" element={<CommunityPortal />} />
                      <Route path="/gis-mapping" element={<GISMapping />} />
                      <Route path="/iot-simulation" element={<IoTSimulation />} />
                      <Route path="/verification-workflow" element={<VerificationWorkflow />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </GameificationProvider>
              </ForumProvider>
            </IoTProvider>
          </DataProvider>
        </NotificationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
