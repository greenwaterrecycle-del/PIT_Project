import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/EmployeeList';
import EmployeeForm from './pages/EmployeeForm';
import DependentList from './pages/DependentList';
import DependentForm from './pages/DependentForm';
import TaxCalculation from './pages/TaxCalculation';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<EmployeeList />} />
            <Route path="/employees/new" element={<EmployeeForm />} />
            <Route path="/employees/:id/edit" element={<EmployeeForm />} />
            <Route path="/employees/:employeeId/dependents" element={<DependentList />} />
            <Route path="/employees/:employeeId/dependents/new" element={<DependentForm />} />
            <Route path="/employees/:employeeId/dependents/:id/edit" element={<DependentForm />} />
            <Route path="/calculate-tax" element={<TaxCalculation />} />
            {/* We will add more routes here later */}
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
