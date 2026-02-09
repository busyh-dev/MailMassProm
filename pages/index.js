import Link from 'next/link';
import { Mail, BarChart3, Users, Send } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Mail className="w-16 h-16 text-blue-600 mr-4" />
            <h1 className="text-5xl font-bold text-gray-900">MailMassProm</h1>
          </div>
          <p className="text-xl text-gray-600 mb-8">
            La piattaforma professionale per email marketing e invii massivi
          </p>
          <Link href="/login">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg">
              🚀 Accedi alla Piattaforma
            </button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Analytics Avanzate</h3>
            <p className="text-gray-600">Tracciamento completo aperture, click e conversioni</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Gestione Contatti</h3>
            <p className="text-gray-600">Liste segmentate e import CSV automatico</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <Send className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Invii Massivi</h3>
            <p className="text-gray-600">Campagne email professionali e automatizzate</p>
          </div>
        </div>
      </div>
    </div>
  );
}