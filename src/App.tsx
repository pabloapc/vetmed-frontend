import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

//admin routes will be added later
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute';

const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then((m) => ({ default: m.Register })));
const Welcome = lazy(() => import('./pages/Welcome'));
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })));
const Veterinarias = lazy(() => import('./pages/Veterinarias').then((m) => ({ default: m.Veterinarias })));
const VeterinariaDetail = lazy(() => import('./pages/VeterinariaDetail').then((m) => ({ default: m.VeterinariaDetail })));
const RegisterEntity = lazy(() => import('./pages/RegisterEntity').then((m) => ({ default: m.RegisterEntity })));
const VeterinariaRequests = lazy(() => import('./pages/VeterinariaRequest').then((m) => ({ default: m.VeterinariaRequests })));
const Requests = lazy(() => import('./pages/Request').then((m) => ({ default: m.Requests })));
const SearchResults = lazy(() => import('./pages/SearchResults').then((m) => ({ default: m.SearchResults })));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ResendVerification = lazy(() => import('./pages/ResendVerification'));
const Emergencies = lazy(() => import('./pages/Emergency').then((m) => ({ default: m.Emergencies })));
const EmergencyRequests = lazy(() => import('./pages/EmergencyRequest').then((m) => ({ default: m.EmergencyRequests })));
const OrganizacionesLanding = lazy(() => import('./pages/OrganizacionesLanding'));
const InsurerDetail = lazy(() => import('./pages/InsurerDetail'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminUserEdit = lazy(() => import('./pages/admin/AdminUserEdit'));
const AdminVeterinarias = lazy(() => import('./pages/admin/AdminVeterinarias'));
const AdminVeterinariaEdit = lazy(() => import('./pages/admin/AdminVeterinariaEdit').then((m) => ({ default: m.AdminVeterinariaEdit })));
const AdminVeterinariaCreate = lazy(() => import('./pages/admin/AdminVeterinariaCreate').then((m) => ({ default: m.AdminVeterinariaCreate })));
const AdminUserCreate = lazy(() => import('./pages/admin/AdminUserCreate').then((m) => ({ default: m.AdminUserCreate })));
const AdminEmergencies = lazy(() => import('./pages/admin/AdminEmergencies'));
const AdminEmergencyEdit = lazy(() => import('./pages/admin/AdminEmegencyEdit').then((m) => ({ default: m.AdminEmergencyEdit })));
const AdminEmergencyCreate = lazy(() => import('./pages/admin/AdminEmergencyCreate').then((m) => ({ default: m.AdminEmergencyCreate })));
const AdminLeads = lazy(() => import('./pages/admin/AdminLeads').then((m) => ({ default: m.AdminLeads })));
const AdminRequests = lazy(() => import('./pages/admin/AdminRequests'));
const AdminPlanCoverages = lazy(() => import('./pages/admin/AdminPlanCoverages'));
const AdminInsurers = lazy(() => import('./pages/admin/AdminInsurers').then((m) => ({ default: m.AdminInsurers })));
const AdminInsurerCreate = lazy(() => import('./pages/admin/AdminInsurerCreate').then((m) => ({ default: m.AdminInsurerCreate })));
const AdminInsurerEdit = lazy(() => import('./pages/admin/AdminInsurerEdit').then((m) => ({ default: m.AdminInsurerEdit })));
const AdminPlans = lazy(() => import('./pages/admin/AdminPlans').then((m) => ({ default: m.AdminPlans })));
const AdminPrestations = lazy(() => import('./pages/admin/AdminPrestations').then((m) => ({ default: m.AdminPrestations })));
const AdminPrestationCreate = lazy(() => import('./pages/admin/AdminPrestationCreate').then((m) => ({ default: m.AdminPrestationCreate })));
const AdminPrestationEdit = lazy(() => import('./pages/admin/AdminPrestationEdit').then((m) => ({ default: m.AdminPrestationEdit })));
 
function App() {
  return (
      <Router>
          <AuthProvider>
              <Layout>
                  <Suspense fallback={<div className="container p-6">Cargando...</div>}>
                  <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/organizaciones" element={<OrganizacionesLanding />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/search" element={<SearchResults />} />
                      <Route
                          path="/register-entity"
                          element={<RegisterEntity />}
                      />
                      <Route path="/verify-email" element={<VerifyEmail />} />
                      <Route
                          path="/resend-verification"
                          element={<ResendVerification />}
                      />
                      <Route
                          path="/welcome"
                          element={
                              <ProtectedRoute>
                                  <Welcome />
                              </ProtectedRoute>
                          }
                      />
                      <Route
                          path="/profile"
                          element={
                              <ProtectedRoute>
                                  <Profile />
                              </ProtectedRoute>
                          }
                      />
                      <Route path="/veterinarias" element={<Veterinarias />} />
                      <Route
                          path="/veterinarias/:id"
                          element={<VeterinariaDetail />}
                      />
                      <Route
                          path="/insurers/:id"
                          element={<InsurerDetail />}
                      />
                      <Route
                          path="/veterinaria/requests"
                          element={<VeterinariaRequests />}
                      />

                      <Route path="/emergencies" element={<Emergencies />} />
                      <Route
                          path="/emergency/requests"
                          element={<EmergencyRequests />}
                      />

                      <Route path="/requests" element={<Requests />} />
                      <Route path="*" element={<Navigate to="/" replace />} />

                      <Route element={<ProtectedAdminRoute />}>
                          <Route path="/admin" element={<AdminDashboard />} />
                          <Route path="/admin/users" element={<AdminUsers />} />
                          <Route
                              path="/admin/users/:id"
                              element={<AdminUserEdit />}
                          />
                          <Route
                              path="/admin/veterinarias"
                              element={<AdminVeterinarias />}
                          />
                          <Route
                              path="/admin/emergencies"
                              element={<AdminEmergencies />}
                          />
                          <Route path="/admin/leads" element={<AdminLeads />} />
                          <Route path="/admin/requests" element={<AdminRequests />} />
                          <Route
                              path="/admin/veterinarias/:id"
                              element={<AdminVeterinariaEdit />}
                          />
                          <Route
                              path="/admin/emergencies/:id"
                              element={<AdminEmergencyEdit />}
                          />

                          <Route
                              path="/admin/users/new"
                              element={<AdminUserCreate />}
                          />
                          <Route
                              path="/admin/veterinarias/new"
                              element={<AdminVeterinariaCreate />}
                          />
                          <Route
                              path="/admin/emergencies/new"
                              element={<AdminEmergencyCreate />}
                          />
                          <Route
                              path="/admin/plan-coverages"
                              element={<AdminPlanCoverages />}
                          />
                          <Route
                              path="/admin/insurers"
                              element={<AdminInsurers />}
                          />
                          <Route
                              path="/admin/insurers/new"
                              element={<AdminInsurerCreate />}
                          />
                          <Route
                              path="/admin/insurers/:id"
                              element={<AdminInsurerEdit />}
                          />
                          <Route
                              path="/admin/plans"
                              element={<AdminPlans />}
                          />
                          <Route
                              path="/admin/prestations"
                              element={<AdminPrestations />}
                          />
                          <Route
                              path="/admin/prestations/new"
                              element={<AdminPrestationCreate />}
                          />
                          <Route
                              path="/admin/prestations/:id"
                              element={<AdminPrestationEdit />}
                          />    
                      </Route>
                  </Routes>
                  </Suspense>
              </Layout>
          </AuthProvider>
      </Router>
  );
}

export default App;
