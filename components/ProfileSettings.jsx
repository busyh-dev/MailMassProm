import React, { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';

const ProfileSettings = ({ showProfileModal, setShowProfileModal }) => {
  const { 
    profile, 
    loading, 
    saving, 
    saveNotifications, 
    saveLanguage, 
    saveDateTimeFormat, 
    savePrivacy, 
    changePassword,
    saveSystemSettings 
  } = useProfile();
  
  const [activeProfileTab, setActiveProfileTab] = useState('notifiche');
  
  // Stati per ogni sezione
  const [notificationsData, setNotificationsData] = useState({});
  const [languageData, setLanguageData] = useState('it');
  const [formatData, setFormatData] = useState({ date_format: 'DD/MM/YYYY', time_format: '24h' });
  const [privacyData, setPrivacyData] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [systemSettings, setSystemSettings] = useState({});
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Carica i dati del profilo
  useEffect(() => {
    if (profile) {
      setNotificationsData({
        notify_new_campaigns: profile.notify_new_campaigns ?? true,
        notify_campaign_results: profile.notify_campaign_results ?? true,
        notify_urgent_updates: profile.notify_urgent_updates ?? true,
        notify_push_new_tasks: profile.notify_push_new_tasks ?? true,
        notify_push_mentions: profile.notify_push_mentions ?? true,
        notify_push_reminders: profile.notify_push_reminders ?? true,
        reminder_weekly_review: profile.reminder_weekly_review ?? true,
        reminder_clock_in: profile.reminder_clock_in ?? true,
      });
      
      setLanguageData(profile.language || 'it');
      
      setFormatData({
        date_format: profile.date_format || 'DD/MM/YYYY',
        time_format: profile.time_format || '24h',
      });
      
      setPrivacyData(profile.accept_offers ?? false);
      
      setSystemSettings({
        smtp_server: profile.smtp_server || 'smtp.mailmassprom.com',
        smtp_port: profile.smtp_port || 587,
        sender_email: profile.sender_email || 'noreply@mailmassprom.com',
        two_factor_enabled: profile.two_factor_enabled ?? false,
        auto_login: profile.auto_login ?? true,
      });
    }
  }, [profile]);

  // Mostra messaggio di successo
  const showSuccessMessage = (message) => {
    const msg = document.createElement("div");
    msg.textContent = message;
    msg.style.position = "fixed";
    msg.style.top = "20px";
    msg.style.left = "50%";
    msg.style.transform = "translateX(-50%)";
    msg.style.background = "#d1fae5";
    msg.style.color = "#065f46";
    msg.style.padding = "12px 24px";
    msg.style.borderRadius = "8px";
    msg.style.fontSize = "14px";
    msg.style.fontWeight = "500";
    msg.style.zIndex = "9999";
    msg.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
  };

  // Mostra messaggio di errore
  const showErrorMessage = (message) => {
    const msg = document.createElement("div");
    msg.textContent = message;
    msg.style.position = "fixed";
    msg.style.top = "20px";
    msg.style.left = "50%";
    msg.style.transform = "translateX(-50%)";
    msg.style.background = "#fee2e2";
    msg.style.color = "#b91c1c";
    msg.style.padding = "12px 24px";
    msg.style.borderRadius = "8px";
    msg.style.fontSize = "14px";
    msg.style.fontWeight = "500";
    msg.style.zIndex = "9999";
    msg.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
  };

  // ✅ Salva Notifiche
  const handleSaveNotifications = async () => {
    const result = await saveNotifications(notificationsData);
    if (result.success) {
      showSuccessMessage(result.message);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowProfileModal(false);
      }, 2000);
    } else {
      showErrorMessage(result.error);
    }
  };

  // ✅ Salva Lingua
  const handleSaveLanguage = async () => {
    const result = await saveLanguage(languageData);
    if (result.success) {
      showSuccessMessage(result.message);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowProfileModal(false);
      }, 2000);
    } else {
      showErrorMessage(result.error);
    }
  };

  // ✅ Salva Formato
  const handleSaveFormat = async () => {
    const result = await saveDateTimeFormat(formatData);
    if (result.success) {
      showSuccessMessage(result.message);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowProfileModal(false);
      }, 2000);
    } else {
      showErrorMessage(result.error);
    }
  };

  // ✅ Salva Privacy
  const handleSavePrivacy = async () => {
    const result = await savePrivacy(privacyData);
    if (result.success) {
      showSuccessMessage(result.message);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowProfileModal(false);
      }, 2000);
    } else {
      showErrorMessage(result.error);
    }
  };

  // ✅ Cambia Password
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showErrorMessage('❌ Le password non corrispondono');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showErrorMessage('❌ La password deve contenere almeno 6 caratteri');
      return;
    }

    const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
    if (result.success) {
      showSuccessMessage(result.message);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowProfileModal(false);
      }, 2000);
    } else {
      showErrorMessage(result.error);
    }
  };

  // ✅ Salva Impostazioni Sistema
  const handleSaveSystemSettings = async () => {
    const result = await saveSystemSettings(systemSettings);
    if (result.success) {
      showSuccessMessage(result.message);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowProfileModal(false);
      }, 2000);
    } else {
      showErrorMessage(result.error);
    }
  };

  if (!showProfileModal) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento profilo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
          <h2 className="text-lg font-bold text-gray-900 mb-4 px-2">Impostazioni</h2>
          
          <nav className="space-y-1">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Generale
            </div>

            <button
              onClick={() => setActiveProfileTab('notifiche')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeProfileTab === 'notifiche'
                  ? 'text-blue-600 bg-blue-50 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Notifiche
            </button>

            <button
              onClick={() => setActiveProfileTab('impostazioni')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeProfileTab === 'impostazioni'
                  ? 'text-blue-600 bg-blue-50 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Impostazioni
            </button>

            <div className="pt-6">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                Account
              </div>

              <button
                onClick={() => setActiveProfileTab('lingua')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeProfileTab === 'lingua'
                    ? 'text-blue-600 bg-blue-50 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Lingua
              </button>

              <button
                onClick={() => setActiveProfileTab('formato')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeProfileTab === 'formato'
                    ? 'text-blue-600 bg-blue-50 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Formato data/ora
              </button>

              <button
                onClick={() => setActiveProfileTab('notifiche2')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeProfileTab === 'notifiche2'
                    ? 'text-blue-600 bg-blue-50 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Notifiche
              </button>

              <button
                onClick={() => setActiveProfileTab('privacy')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeProfileTab === 'privacy'
                    ? 'text-blue-600 bg-blue-50 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Privacy
              </button>

              <div className="pt-6">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Accesso e sicurezza
                </div>

                <button
                  onClick={() => setActiveProfileTab('cambia-password')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeProfileTab === 'cambia-password'
                      ? 'text-blue-600 bg-blue-50 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Cambia la tua password
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* Contenuto principale */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Il mio profilo</h1>
              <p className="text-gray-600">Gestisci le tue informazioni personali</p>
            </div>
            <button
              onClick={() => setShowProfileModal(false)}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Sezione Notifiche2 */}
          {activeProfileTab === 'notifiche2' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Notifiche</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={notificationsData.notify_new_campaigns || false}
                      onChange={(e) => setNotificationsData({ ...notificationsData, notify_new_campaigns: e.target.checked })}
                    />
                    <span className="ml-2">Email</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={notificationsData.notify_push_new_tasks || false}
                      onChange={(e) => setNotificationsData({ ...notificationsData, notify_push_new_tasks: e.target.checked })}
                    />
                    <span className="ml-2">Push</span>
                  </label>
                </div>

                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700">Promemoria</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={notificationsData.reminder_weekly_review || false}
                        onChange={(e) => setNotificationsData({ ...notificationsData, reminder_weekly_review: e.target.checked })}
                      />
                      <span className="ml-2">Review settimanale</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={notificationsData.reminder_clock_in || false}
                        onChange={(e) => setNotificationsData({ ...notificationsData, reminder_clock_in: e.target.checked })}
                      />
                      <span className="ml-2">Ricordati di timbrare</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  disabled={saving}
                >
                  Annulla
                </button>
                <button 
                  onClick={handleSaveNotifications}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
              </div>
            </div>
          )}

          {/* Sezione Lingua */}
          {activeProfileTab === 'lingua' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Seleziona lingua</h2>
              <select 
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={languageData}
                onChange={(e) => setLanguageData(e.target.value)}
              >
                <option value="it">Italiano</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  disabled={saving}
                >
                  Annulla
                </button>
                <button 
                  onClick={handleSaveLanguage}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
              </div>
            </div>
          )}

          {/* Sezione Formato */}
          {activeProfileTab === 'formato' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Formato Data/Ora</h2>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Data</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="data" 
                      value="DD/MM/YYYY"
                      checked={formatData.date_format === 'DD/MM/YYYY'}
                      onChange={(e) => setFormatData({ ...formatData, date_format: e.target.value })}
                    />
                    <span className="ml-2">GG/MM/AAAA</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="data" 
                      value="MM/DD/YYYY"
                      checked={formatData.date_format === 'MM/DD/YYYY'}
                      onChange={(e) => setFormatData({ ...formatData, date_format: e.target.value })}
                    />
                    <span className="ml-2">MM/GG/AAAA</span>
                  </label>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700">Orario</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="orario" 
                      value="24h"
                      checked={formatData.time_format === '24h'}
                      onChange={(e) => setFormatData({ ...formatData, time_format: e.target.value })}
                    />
                    <span className="ml-2">13:00</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="orario" 
                      value="12h"
                      checked={formatData.time_format === '12h'}
                      onChange={(e) => setFormatData({ ...formatData, time_format: e.target.value })}
                    />
                    <span className="ml-2">1:00 PM</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  disabled={saving}
                >
                  Annulla
                </button>
                <button 
                  onClick={handleSaveFormat}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
              </div>
            </div>
          )}

          {/* Sezione Privacy */}
          {activeProfileTab === 'privacy' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Privacy</h2>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={privacyData}
                    onChange={(e) => setPrivacyData(e.target.checked)}
                  />
                  <span className="ml-2">Accetto di ricevere offerte</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  disabled={saving}
                >
                  Annulla
                </button>
                <button 
                  onClick={handleSavePrivacy}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
              </div>
            </div>
          )}

          {/* Sezione Cambia Password */}
          {activeProfileTab === 'cambia-password' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Cambia la tua password</h2>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Password attuale</label>
                <input 
                  type="password" 
                  className="w-full p-3 border border-gray-300 rounded-lg mt-2" 
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700">Nuova password</label>
                <input 
                  type="password" 
                  className="w-full p-3 border border-gray-300 rounded-lg mt-2" 
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700">Conferma nuova password</label>
                <input 
                  type="password" 
                  className="w-full p-3 border border-gray-300 rounded-lg mt-2" 
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  onClick={() => {
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setShowProfileModal(false);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  disabled={saving}
                >
                  Annulla
                </button>
                <button 
                  onClick={handleChangePassword}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Aggiornamento...' : 'Salva Modifiche'}
                </button>
              </div>
            </div>
          )}

          {/* Sezione Impostazioni Sistema (Admin) */}
          {activeProfileTab === 'impostazioni' && profile?.role === 'admin' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Impostazioni Sistema</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Server SMTP</label>
                  <input
                    type="text"
                    value={systemSettings.smtp_server || ''}
                    onChange={(e) => setSystemSettings({ ...systemSettings, smtp_server: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Porta SMTP</label>
                  <input
                    type="number"
                    value={systemSettings.smtp_port || ''}
                    onChange={(e) => setSystemSettings({ ...systemSettings, smtp_port: parseInt(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Mittente</label>
                  <input
                    type="email"
                    value={systemSettings.sender_email || ''}
                    onChange={(e) => setSystemSettings({ ...systemSettings, sender_email: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="font-medium text-gray-900">Autenticazione a due fattori</p>
                    <p className="text-sm text-gray-600">Aumenta la sicurezza</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={systemSettings.two_factor_enabled || false}
                      onChange={(e) => setSystemSettings({ ...systemSettings, two_factor_enabled: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Login automatico</p>
                    <p className="text-sm text-gray-600">Ricorda per 30 giorni</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={systemSettings.auto_login || false}
                      onChange={(e) => setSystemSettings({ ...systemSettings, auto_login: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  disabled={saving}
                >
                  Annulla
                </button>
                <button 
                  onClick={handleSaveSystemSettings}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;