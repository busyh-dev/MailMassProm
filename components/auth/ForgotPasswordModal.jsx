import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { X, Mail, Loader2 } from "lucide-react";

export default function ForgotPasswordModal({ show, onClose }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/reset-password-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const json = await res.json();
    if (!res.ok) toast.error(json.error);
    else {
      toast.success("Email inviata!");
      onClose();
    }

    setLoading(false);
  };

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex justify-center items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white dark:bg-slate-800 p-6 rounded-xl w-full max-w-md relative shadow-2xl"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <h2 className="text-xl font-bold mb-4">Password dimenticata?</h2>

            <form onSubmit={handleRequest} className="space-y-4">
              <input
                className="w-full border rounded-lg px-3 py-2"
                type="email"
                placeholder="Inserisci email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <button
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg flex justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Mail />}
                Invia reset
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}



