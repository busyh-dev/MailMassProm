import { useEffect, useState } from "react";
import { CheckCircle, Trash2 } from "lucide-react";

const SuccessModal = ({ show, type = "success", message = "", duration = 2000, onClose }) => {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!visible) return null;

  const iconProps = {
    size: 48,
    className: "mx-auto mb-3",
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black bg-opacity-30 backdrop-blur-sm animate-fadeIn">
      <div
        className={`bg-white p-6 rounded-2xl shadow-lg w-[320px] text-center border ${
          type === "delete" ? "border-red-200" : "border-green-200"
        }`}
      >
        {type === "delete" ? (
          <Trash2 {...iconProps} className="text-red-500 mx-auto mb-3 animate-bounce" />
        ) : (
          <CheckCircle {...iconProps} className="text-green-500 mx-auto mb-3 animate-bounce" />
        )}
        <h3
          className={`text-lg font-semibold ${
            type === "delete" ? "text-red-600" : "text-green-600"
          }`}
        >
          {message}
        </h3>
      </div>
    </div>
  );
};

export default SuccessModal;
