import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import ForgotPassword from '@/pages/ForgotPassword'
import Overview from '@/pages/Overview'
import Transactions from '@/pages/Transactions'
import TransactionDetails from '@/pages/TransactionDetails'
import RiskMonitoring from '@/pages/RiskMonitoring'
import Investigations from '@/pages/Investigations'
import InvestigationDetails from '@/pages/InvestigationDetails'
import Verification from '@/pages/Verification'
import VerificationDetails from '@/pages/VerificationDetails'
import Customers from '@/pages/Customers'
import Beneficiaries from '@/pages/Beneficiaries'
import Analytics from '@/pages/Analytics'
import AuditLogs from '@/pages/AuditLogs'
import Settings from '@/pages/Settings'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<Overview />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/transactions/:id" element={<TransactionDetails />} />
                <Route path="/risk-monitoring" element={<RiskMonitoring />} />
                <Route path="/investigations" element={<Investigations />} />
                <Route path="/investigations/:caseId" element={<InvestigationDetails />} />
                <Route path="/verification" element={<Verification />} />
                <Route path="/verification/:id" element={<VerificationDetails />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/beneficiaries" element={<Beneficiaries />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
