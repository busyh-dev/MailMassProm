// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PermissionsProvider } from './contexts/PermissionsContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Unauthorized } from './pages/Unauthorized';

function App() {
  return (
    <BrowserRouter>
      <PermissionsProvider>
        <Routes>
          {/* Route pubbliche */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Dashboard base (tutti gli autenticati) */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          {/* Campagne - richiede permessi specifici */}
          <Route path="/campaigns" element={
            <ProtectedRoute module="campaigns">
              <CampaignsList />
            </ProtectedRoute>
          } />

          <Route path="/campaigns/new" element={
            <ProtectedRoute permission="campaigns.create">
              <NewCampaign />
            </ProtectedRoute>
          } />

          {/* Templates */}
          <Route path="/templates" element={
            <ProtectedRoute module="templates">
              <TemplatesList />
            </ProtectedRoute>
          } />

          {/* Admin - solo per admin e super_admin */}
          <Route path="/admin/users" element={
            <ProtectedRoute requireAdmin={true}>
              <UsersManagement />
            </ProtectedRoute>
          } />

          {/* Gestione ruoli - solo super_admin */}
          <Route path="/admin/roles" element={
            <ProtectedRoute requireSuperAdmin={true}>
              <RolesManagement />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </PermissionsProvider>
    </BrowserRouter>
  );
}

export default App;