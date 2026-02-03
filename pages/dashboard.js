import EmailPlatform from '../components/email/EmailPlatform';
import ProtectedRoute from '../components/auth/ProtectedRoute';

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <EmailPlatform />
    </ProtectedRoute>
  );
}