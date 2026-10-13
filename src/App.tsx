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
import { LanguageProvider } from "@/contexts/LanguageContext";
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
import CarbonWallet from "./pages/CarbonWallet";
import Notifications from "./pages/Notifications";
import Analytics from "./pages/Analytics";
import FraudDetection from "./pages/FraudDetection";
import ThreeDVisualization from "./pages/ThreeDVisualization";
import CalculationManager from "./pages/CalculationManager";
import NotFound from "./pages/NotFound";
import { ProtectedRoute, RoleRoute } from './components/RouteGuards';
import type { FrontendUserRole } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import UX4GFooter from '@/components/UX4GFooter';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import ScrollToTop from '@/components/ScrollToTop';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <DataProvider>
            <NotificationProvider>
              <IoTProvider>
                <ForumProvider>
                  <GameificationProvider>
                    <BrowserRouter>
                      <div className="min-h-screen flex flex-col">
                        <Navbar />
                        <ScrollToTop />
                        <main className="flex-1">
                          <Routes>
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />

                            {/* Authenticated routes */}
                            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                            <Route path="/upload" element={<ProtectedRoute><DataUpload /></ProtectedRoute>} />
                            <Route path="/registry" element={<ProtectedRoute><Registry /></ProtectedRoute>} />
                            <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
                            <Route path="/wallet" element={<ProtectedRoute><CarbonWallet /></ProtectedRoute>} />

                            {/* Admin-only */}
                            <Route path="/admin" element={<RoleRoute allowed={["admin"] as FrontendUserRole[]}><AdminPanel /></RoleRoute>} />

                            <Route path="/community" element={<CommunityPortal />} />
                            <Route path="/gis-mapping" element={<GISMapping />} />
                            <Route path="/iot-simulation" element={<IoTSimulation />} />

                            {/* Verification workflow: admin and govt officer */}
                            <Route
                              path="/verification-workflow"
                              element={<RoleRoute allowed={["admin", "government_officer"] as FrontendUserRole[]}><VerificationWorkflow /></RoleRoute>}
                            />

                            {/* Calculation Manager: project developers, admins, govt officers */}
                            <Route
                              path="/calculations"
                              element={<RoleRoute allowed={["admin", "government_officer", "project_developer"] as FrontendUserRole[]}><CalculationManager /></RoleRoute>}
                            />

                            {/* New pages */}
                            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                            <Route path="/fraud-detection" element={<RoleRoute allowed={["admin"] as FrontendUserRole[]}><FraudDetection /></RoleRoute>} />
                            <Route path="/3d-visualization" element={<ProtectedRoute><ThreeDVisualization /></ProtectedRoute>} />

                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </main>
                        <UX4GFooter />
                        <PWAInstallPrompt />
                      </div>
                    </BrowserRouter>
                  </GameificationProvider>
                </ForumProvider>
              </IoTProvider>
            </NotificationProvider>
          </DataProvider>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;