import { Navigate, Route, Routes } from 'react-router';
import { AdminVeterinariansPage } from '../features/admin/pages/AdminVeterinariansPage';
import { ADMIN_HOME } from '../features/admin/types';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { ClinicsPage } from '../features/clinics/pages/ClinicsPage';
import { AppointmentsPage } from '../features/appointments/pages/AppointmentsPage';
import { PatientAppointmentsPage } from '../features/appointments/pages/PatientAppointmentsPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { PatientMedicalHistoryPage } from '../features/medical-records/pages/PatientMedicalHistoryPage';
import { PatientMedicationsPage } from '../features/medications/pages/PatientMedicationsPage';
import { PatientVaccinationsPage } from '../features/vaccinations/pages/PatientVaccinationsPage';
import { PatientProfilePage } from '../features/patients/pages/PatientProfilePage';
import { PatientsPage } from '../features/patients/pages/PatientsPage';
import { ProfilePage } from '../features/profile/pages/ProfilePage';
import { SettingsPage } from '../features/settings/pages/SettingsPage';
import { AuthenticatedLayout } from '../layouts/AuthenticatedLayout';
import { MainLayout } from '../layouts/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { AdminRoute, ClinicalRoute } from './RoleRoutes';
import { RootRedirect } from './RootRedirect';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route element={<PublicRoute />}>
        <Route
          path="/login"
          element={
            <MainLayout>
              <LoginPage />
            </MainLayout>
          }
        />
        <Route
          path="/register"
          element={
            <MainLayout>
              <RegisterPage />
            </MainLayout>
          }
        />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AuthenticatedLayout />}>
          <Route element={<AdminRoute />}>
            <Route path={ADMIN_HOME} element={<AdminVeterinariansPage />} />
          </Route>
          <Route element={<ClinicalRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/patients/:id" element={<PatientProfilePage />} />
            <Route
              path="/patients/:id/medical-history"
              element={<PatientMedicalHistoryPage />}
            />
            <Route
              path="/patients/:id/medications"
              element={<PatientMedicationsPage />}
            />
            <Route
              path="/patients/:id/vaccinations"
              element={<PatientVaccinationsPage />}
            />
            <Route
              path="/patients/:id/appointments"
              element={<PatientAppointmentsPage />}
            />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/clinics" element={<ClinicsPage />} />
          </Route>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
