// src/pages/Unauthorized.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { usePermissions } from '../contexts/PermissionsContext';

export const Unauthorized = () => {
  const navigate = useNavigate();
  const { profile, role } = usePermissions();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Accesso Negato
        </h1>
        
        <p className="text-gray-600 mb-6">
          Non hai i permessi necessari per accedere a questa pagina.
        </p>

        {profile && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-600 mb-1">
              <strong>Account:</strong> {profile.full_name || profile.email}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Ruolo:</strong> {role?.name || 'Nessun ruolo'}
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Indietro
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Dashboard
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          Se pensi che questo sia un errore, contatta l'amministratore.
        </p>
      </div>
    </div>
  );
};