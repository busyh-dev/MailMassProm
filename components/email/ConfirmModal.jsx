import { useEffect, useState } from "react";

/* 🧩 Hook per animazione montaggio/smontaggio */
const useAnimatedUnmount = (isMounted, delay = 200) => {
  const [shouldRender, setShouldRender] = useState(isMounted);
  const [animationClass, setAnimationClass] = useState("");

  useEffect(() => {
    if (isMounted) {
      setShouldRender(true);
      setAnimationClass("animate-fadeZoomIn");
    } else if (shouldRender) {
      setAnimationClass("animate-fadeZoomOut");
      const timeout = setTimeout(() => setShouldRender(false), delay);
      return () => clearTimeout(timeout);
    }
  }, [isMounted]);

  return { shouldRender, animationClass };
};

/* ----------------------- COMPONENTE ----------------------- */
export const ConfirmModal = ({
  title = "Conferma",
  message = "",
  confirmLabel = "Conferma",
  cancelLabel = "Annulla",
  danger = false,
  onConfirm,
  onCancel,
  show = true,
}) => {
  const { shouldRender, animationClass } = useAnimatedUnmount(show);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/60 flex items-center justify-center z-[9998] backdrop-blur-sm transition-all ${animationClass}`}
    >
      <div
        className={`bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center ${animationClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>
        {message && <p className="text-sm text-gray-600 mb-6">{message}</p>}

        <div className="flex justify-center gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm rounded-lg text-white transition ${
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
