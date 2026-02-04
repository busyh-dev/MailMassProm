import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Breadcrumb from "@/components/Breadcrumb";
import { Clock, Check, X } from "lucide-react";

export default function UserResetTimeline() {
  const router = useRouter();
  const { email } = router.query;

  const [logs, setLogs] = useState([]);

  const fetchUserLogs = async () => {
    if (!email) return;

    const { data } = await supabase
      .from("password_reset_logs")
      .select("*")
      .eq("email", email)
      .order("requested_at", { ascending: false });

    setLogs(data || []);
  };

  const sendManualReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  
    if (error) {
      toast.error("Errore nell’invio dell’email");
    } else {
      toast.success("Email di reset inviata!");
    }
  };
  

  useEffect(() => {
    fetchUserLogs();
  }, [email]);

  return (
    <div className="p-8 min-h-screen bg-slate-100 dark:bg-slate-900">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Reset Logs", href: "/admin/reset-logs" },
          { label: email },
        ]}
      />

      <h1 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">
        Attività reset password — {email}
      </h1>
      <button
  onClick={sendManualReset}
  className="mt-4 mb-8 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow flex items-center gap-2"
>
  ✉️ Invia email di reset password
</button>

      <div className="space-y-6">
        {logs.map((log, i) => (
          <div
            key={i}
            className="flex items-start gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow"
          >
            <Clock className="w-6 h-6 text-slate-500 mt-1" />
            <div>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {new Date(log.requested_at).toLocaleString()}
              </p>

              <p className="mt-1 flex items-center gap-2">
                {log.success ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <Check size={16} /> Successo
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1">
                    <X size={16} /> Fallito
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {logs.length === 0 && (
        <p className="text-center text-slate-500 mt-10">
          Nessuna attività trovata
        </p>
      )}
    </div>
  );
}
