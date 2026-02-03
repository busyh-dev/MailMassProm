// components/OfflineBanner.jsx
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { WifiOff } from "lucide-react"; // opzionale, solo se usi lucide-react

export default function OfflineBanner() {
  const { isOnline } = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999]">
      <div className="bg-red-600 text-white text-sm py-2 px-4 text-center flex items-center justify-center gap-2 shadow-md">
        <WifiOff className="w-4 h-4" />
        <span>Sei offline — alcune operazioni verranno ritentate automaticamente</span>
      </div>
    </div>
  );
}
