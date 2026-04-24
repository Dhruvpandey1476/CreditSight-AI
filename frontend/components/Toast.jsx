import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useEffect } from "react";

export default function Toast({ message, type = "info", onClose, visible }) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  const bgColors = {
    success: "bg-[#0a2e16] border-[#14532d] text-[#bbf7d0]",
    error: "bg-[#450a0a] border-[#7f1d1d] text-[#fecaca]",
    info: "bg-[#082f49] border-[#0c4a6e] text-[#bae6fd]",
  };

  const icons = {
    success: <CheckCircle size={18} className="text-[#4ade80]" />,
    error: <AlertCircle size={18} className="text-[#f87171]" />,
    info: <Info size={18} className="text-[#38bdf8]" />,
  };

  return (
    <div 
      className={`fixed top-6 right-6 z-50 transition-all duration-300 ease-out transform ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-2xl ${bgColors[type]} min-w-[300px] max-w-md`}>
        {icons[type]}
        <p className="text-sm font-medium flex-1">{message}</p>
        <button 
          onClick={onClose}
          className="text-white/50 hover:text-white transition-colors p-1"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
