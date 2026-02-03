// pages/email-accounts.jsx (o il tuo componente)
import OnlineStatusBadge from '../components/OnlineStatusBadge';
import { OnlineStatusToaster } from '../components/OnlineStatusToaster'; // opzionale
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useEmailAccounts } from '../hooks/useEmailAccounts';

export default function EmailAccountsPage() {
  const { isOnline } = useOnlineStatus();
  const { accounts, loading, addAccount, deleteAccount } = useEmailAccounts();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Account Email</h1>
        <OnlineStatusBadge />
      </div>

      {/* opzionale: una sola volta nel layout root */}
      <OnlineStatusToaster />

      <div className="flex gap-2">
        <button
          className="rounded-lg px-4 py-2 bg-blue-600 text-white disabled:opacity-50"
          onClick={() => addAccount({ name: 'Nuovo', email: 'nuovo@example.com' })}
          disabled={!isOnline || loading}
          title={!isOnline ? 'Sei offline: riproverò al ritorno della connessione' : undefined}
        >
          Aggiungi account
        </button>
      </div>

      <ul className="divide-y border rounded-lg">
        {accounts.map((a) => (
          <li key={a.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{a.name}</div>
              <div className="text-sm text-gray-600">{a.email}</div>
            </div>
            <button
              className="text-red-600 hover:underline disabled:opacity-40"
              onClick={() => deleteAccount(a.id)}
              disabled={!isOnline || loading}
              title={!isOnline ? 'Sei offline: l’operazione verrà ritentata quando torni online' : undefined}
            >
              Elimina
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
