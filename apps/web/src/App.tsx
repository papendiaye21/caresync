import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth } from "./pages/RequireAuth";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { PortfolioPage } from "./pages/PortfolioPage";
import { HomeRedirect } from "./pages/HomeRedirect";
import { RequirePatientRole } from "./pages/RequirePatientRole";
import { RequireClinicRole } from "./pages/RequireClinicRole";
import { PlatformMapPage } from "./pages/platform/PlatformMapPage";
import { PatientLayout } from "./layouts/PatientLayout";
import { ClinicLayout } from "./layouts/ClinicLayout";
import { MapLayout } from "./layouts/MapLayout";
import { PatientHub } from "./pages/patient/Hub";
import {
  PatientBookAppointment,
  PatientPreVisit,
  PatientMessages,
  PatientPrescriptions,
  PatientMedications,
  PatientVitals,
  PatientLabs,
  PatientBilling,
  PatientEmergencyQr,
} from "./pages/patient/Screens";
import { ClinicHub } from "./pages/clinic/Hub";
import { ClinicCalendar } from "./pages/clinic/Calendar";
import { ClinicPatientsList } from "./pages/clinic/PatientsList";
import { ClinicPatientEhr } from "./pages/clinic/PatientEhr";
import {
  ClinicMessaging,
  ClinicPrescriptions,
  ClinicVitalsDashboard,
  ClinicLabUpload,
  ClinicBilling,
  ClinicEmergency,
} from "./pages/clinic/Screens";
export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/" element={<PortfolioPage />} />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <HomeRedirect />
          </RequireAuth>
        }
      />
      <Route
        path="/map"
        element={
          <RequireAuth>
            <MapLayout />
          </RequireAuth>
        }
      >
        <Route index element={<PlatformMapPage />} />
      </Route>
      {/* Patient portal */}
      <Route
        path="/patient"
        element={
          <RequireAuth>
            <RequirePatientRole>
              <PatientLayout />
            </RequirePatientRole>
          </RequireAuth>
        }
      >
        <Route index element={<PatientHub />} />
        <Route path="appointments/book" element={<PatientBookAppointment />} />
        <Route path="pre-visit" element={<PatientPreVisit />} />
        <Route path="messages" element={<PatientMessages />} />
        <Route path="prescriptions" element={<PatientPrescriptions />} />
        <Route path="medications" element={<PatientMedications />} />
        <Route path="vitals" element={<PatientVitals />} />
        <Route path="labs" element={<PatientLabs />} />
        <Route path="billing" element={<PatientBilling />} />
        <Route path="emergency-qr" element={<PatientEmergencyQr />} />
      </Route>
      {/* Clinic portal */}
      <Route
        path="/clinic"
        element={
          <RequireAuth>
            <RequireClinicRole>
              <ClinicLayout />
            </RequireClinicRole>
          </RequireAuth>
        }
      >
        <Route index element={<ClinicHub />} />
        <Route path="calendar" element={<ClinicCalendar />} />
        <Route path="patients" element={<ClinicPatientsList />} />
        <Route path="patients/:id" element={<ClinicPatientEhr />} />
        <Route path="messages" element={<ClinicMessaging />} />
        <Route path="prescriptions" element={<ClinicPrescriptions />} />
        <Route path="vitals-dashboard" element={<ClinicVitalsDashboard />} />
        <Route path="labs" element={<ClinicLabUpload />} />
        <Route path="billing" element={<ClinicBilling />} />
        <Route path="emergency" element={<ClinicEmergency />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
