import React, { useState } from 'react';
import { 
  Mail, 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  Shield, 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

// Componente separato per evitare re-render
const InputField = ({ 
  name, 
  type = 'text', 
  placeholder, 
  icon: Icon, 
  showPasswordToggle, 
  showPassword, 
  onTogglePassword,
  value,
  onChange,
  errors = {},
  isLoading = false
}) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Icon className="h-5 w-5 text-gray-400" />
    </div>
    <input
      type={showPasswordToggle ? (showPassword ? 'text' : 'password') : type}
      name={name}
      value={value}
      onChange={onChange}
      className={`block w-full pl-10 pr-10 py-3 border rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
        errors[name] 
          ? 'border-red-300 focus:ring-red-500' 
          : 'border-gray-300 focus:ring-blue-500'
      }`}
      placeholder={placeholder}
      disabled={isLoading}
      autoComplete={
        name === 'email' ? 'email' : 
        name === 'password' ? 'current-password' :
        name === 'confirmPassword' ? 'new-password' :
        name === 'name' ? 'name' : 'off'
      }
    />
    {showPasswordToggle && (
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
        <button
          type="button"
          className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
          onClick={onTogglePassword}
          disabled={isLoading}
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    )}
    {errors[name] && (
      <div className="mt-1 flex items-center text-sm text-red-600">
        <AlertCircle className="h-4 w-4 mr-1" />
        {errors[name]}
      </div>
    )}
  </div>
);

const LoginTestPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    acceptTerms: false
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Rimuovi errore quando l'utente inizia a digitare
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email richiesta';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email non valida';
    }

    if (!formData.password) {
      newErrors.password = 'Password richiesta';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password deve essere di almeno 8 caratteri';
    }

    if (!isLogin) {
      if (!formData.name) {
        newErrors.name = 'Nome richiesto';
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Conferma password richiesta';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Le password non coincidono';
      }

      if (!formData.acceptTerms) {
        newErrors.acceptTerms = 'Devi accettare i termini di servizio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    // Simula chiamata API
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsLoading(false);
    alert('Form inviato!');
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      acceptTerms: false
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="min-h-screen flex">
        {/* Pannello Sinistro - Branding */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-2/5">
          <div className="flex flex-col justify-center w-full max-w-md mx-auto p-12">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-blue-600 p-3 rounded-2xl">
                  <Mail className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">MailMassProm</h1>
              <p className="text-gray-600 text-lg">Piattaforma Professionale di Email Marketing</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 p-2 rounded-lg mt-1">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Invii Illimitati</h3>
                  <p className="text-gray-600 text-sm">Raggiungi migliaia di clienti con campagne personalizzate</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg mt-1">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Sicurezza Garantita</h3>
                  <p className="text-gray-600 text-sm">I tuoi dati sono protetti con crittografia avanzata</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 p-2 rounded-lg mt-1">
                  <ArrowRight className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Setup Immediato</h3>
                  <p className="text-gray-600 text-sm">Inizia a inviare email in meno di 5 minuti</p>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white">
              <blockquote className="text-sm italic mb-3">
                {/* "MailMassProm ha trasformato completamente la nostra strategia di email marketing. Risultati incredibili!" */}
              </blockquote>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Marco Verdi</div>
                  <div className="text-xs opacity-80">CEO, TechStart Italia</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pannello Destro - Form */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            {/* Logo Mobile */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-blue-600 p-3 rounded-2xl">
                  <Mail className="w-6 h-6 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">MailMassProm</h1>
            </div>

            {/* Header Form */}
            <div className="text-center lg:text-left mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                {isLogin ? 'Bentornato!' : 'Crea Account'}
              </h2>
              <p className="mt-2 text-gray-600">
                {isLogin 
                  ? 'Accedi al tuo account per continuare' 
                  : 'Inizia la tua prova gratuita oggi'
                }
              </p>
            </div>

            {/* Toggle Login/Register */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <button
                type="button"
                onClick={() => !isLoading && handleToggleMode()}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  isLogin 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                } ${isLoading ? 'cursor-not-allowed' : ''}`}
                disabled={isLoading}
              >
                Accedi
              </button>
              <button
                type="button"
                onClick={() => !isLoading && handleToggleMode()}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  !isLogin 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                } ${isLoading ? 'cursor-not-allowed' : ''}`}
                disabled={isLoading}
              >
                Registrati
              </button>
            </div>

            {/* Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {!isLogin && (
                <InputField
                  name="name"
                  placeholder="Nome completo"
                  icon={User}
                  value={formData.name}
                  onChange={handleInputChange}
                  errors={errors}
                  isLoading={isLoading}
                />
              )}

              <InputField
                name="email"
                type="email"
                placeholder="Email"
                icon={Mail}
                value={formData.email}
                onChange={handleInputChange}
                errors={errors}
                isLoading={isLoading}
              />

              <InputField
                name="password"
                placeholder="Password"
                icon={Lock}
                showPasswordToggle
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
                value={formData.password}
                onChange={handleInputChange}
                errors={errors}
                isLoading={isLoading}
              />

              {!isLogin && (
                <InputField
                  name="confirmPassword"
                  placeholder="Conferma Password"
                  icon={Lock}
                  showPasswordToggle
                  showPassword={showConfirmPassword}
                  onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  errors={errors}
                  isLoading={isLoading}
                />
              )}

              {!isLogin && (
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="acceptTerms"
                      name="acceptTerms"
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={handleInputChange}
                      className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 ${
                        isLoading ? 'cursor-not-allowed' : ''
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="acceptTerms" className="text-gray-600">
                      Accetto i{' '}
                      <a href="#" className="text-blue-600 hover:text-blue-500 font-medium">
                        Termini di Servizio
                      </a>{' '}
                      e la{' '}
                      <a href="#" className="text-blue-600 hover:text-blue-500 font-medium">
                        Privacy Policy
                      </a>
                    </label>
                    {errors.acceptTerms && (
                      <div className="mt-1 flex items-center text-sm text-red-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.acceptTerms}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  )}
                  {isLoading 
                    ? (isLogin ? 'Accesso...' : 'Registrazione...') 
                    : isLogin 
                      ? 'Accedi alla Piattaforma' 
                      : 'Crea Account Gratuito'
                  }
                </button>
              </div>

              {isLogin && (
                <div className="text-center">
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
                    Password dimenticata?
                  </a>
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500">
                {isLogin ? "Non hai un account? " : "Hai già un account? "}
                <button
                  type="button"
                  onClick={handleToggleMode}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                  disabled={isLoading}
                >
                  {isLogin ? 'Registrati gratis' : 'Accedi'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginTestPage;