import { useState, useEffect, useMemo, useRef } from "react";
import { Paperclip, FileText, Download, ExternalLink, X } from "lucide-react";
import Select from "react-select";
import { TiptapEditor } from "./TiptapEditor";
import { ConfirmModal } from "./ConfirmModal";

/* 🧩 Hook per animazioni fluide */
const useAnimatedUnmount = (isMounted, delay = 250) => {
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

/* ----------------------- MODALE MODIFICA CAMPAGNA ----------------------- */
export const EditCampaignModal = ({ campaign, onClose, onSave, contacts = [] }) => {
  const [campaignName, setCampaignName] = useState(campaign.name || "");
  const [showLoadMessage, setShowLoadMessage] = useState(false);
  const [subject, setSubject] = useState(campaign.subject || "");
  const [emailContent, setEmailContent] = useState(campaign.content || "<p></p>");
  const [recipientList, setRecipientList] = useState(campaign.recipients || []);
  const [selectedAccount, setSelectedAccount] = useState(campaign.account || "");
  const [cc, setCc] = useState(campaign.cc || "");
  const [bcc, setBcc] = useState(campaign.bcc || "");

  // 🔄 Sincronizza i dati della campagna quando cambia o quando si apre la modale
 // 🔄 Sincronizza i dati della campagna quando cambia o quando si apre la modale
 useEffect(() => {
    if (!campaign) return;
  
    // ✅ USA I NOMI CORRETTI DAL DATABASE
    setCampaignName(campaign.campaign_name || "");
    setSubject(campaign.subject || "");
    setEmailContent(campaign.email_content || "<p></p>");
    setRecipientList(campaign.recipient_list || []);
    setSelectedAccount(campaign.sender_email || "");
    setCc(campaign.cc || "");
    setBcc(campaign.bcc || "");
    setAttachments(
      (campaign.attachments || []).map((a) => ({
        ...a,
        preview: a.type?.startsWith("image/") ? a.url : null,
        isPdf: a.type === "application/pdf",
      }))
    );
  
    setShowLoadMessage(true);
    const timer = setTimeout(() => setShowLoadMessage(false), 2000);
    return () => clearTimeout(timer);
  }, [campaign]);
  
  // 📎 Allegati
  const fileInputRef = useRef(null);
  const [attachments, setAttachments] = useState(campaign.attachments || []);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewPdf, setPreviewPdf] = useState(null);

  // 🎞️ Hook per le animazioni di lightbox e PDF
  const { shouldRender: showImage, animationClass: imageAnim } = useAnimatedUnmount(!!previewImage);
  const { shouldRender: showPdf, animationClass: pdfAnim } = useAnimatedUnmount(!!previewPdf);

  /* 🧠 Inizializzazione al cambio campagna */
    /* 📂 Aggiunge allegati */
  const handleAddAttachments = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newFiles = files.map((file) => ({
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        isPdf: file.type === "application/pdf",
        filename: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
      }));
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  /* ❌ Rimuove allegato */
  const handleRemoveAttachment = (index) => {
    const removed = attachments[index];
    if (removed.preview) URL.revokeObjectURL(removed.preview);
    if (removed.url) URL.revokeObjectURL(removed.url);
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  /* 📏 Dimensione totale allegati */
  const totalSize = useMemo(() => {
    const bytes = attachments.reduce((sum, a) => sum + (a.file?.size || a.size || 0), 0);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }, [attachments]);

  /* 🧠 Icone file */
  const getFileIcon = (type, filename) => {
    if (type?.includes("pdf")) return "📕";
    if (type?.includes("zip") || filename?.endsWith(".zip")) return "🗜️";
    if (type?.includes("word") || filename?.endsWith(".docx")) return "📘";
    if (type?.includes("excel") || filename?.endsWith(".xls")) return "📗";
    if (type?.includes("text") || filename?.endsWith(".txt")) return "📄";
    return "📁";
  };

  // ⚙️ Stati per feedback
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [ccError, setCcError] = useState("");
  const [bccError, setBccError] = useState("");

  /* 📧 Validazione email */
  const validateEmails = (input) => {
    if (!input) return true;
    const emails = input.split(",").map((e) => e.trim()).filter(Boolean);
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emails.every((email) => regex.test(email));
  };
  const handleCcChange = (v) => {
    setCc(v);
    setCcError(!validateEmails(v) ? "Una o più email non sono valide. Usa la virgola per separarle." : "");
  };
  const handleBccChange = (v) => {
    setBcc(v);
    setBccError(!validateEmails(v) ? "Una o più email non sono valide. Usa la virgola per separarle." : "");
  };

  /* 🔍 Controlla modifiche */
  const hasChanges = useMemo(() => {
    return (
      campaignName !== campaign.name ||
      subject !== campaign.subject ||
      emailContent !== campaign.content ||
      selectedAccount !== campaign.account ||
      cc !== campaign.cc ||
      bcc !== campaign.bcc ||
      JSON.stringify(recipientList) !== JSON.stringify(campaign.recipients)
    );
  }, [campaign, campaignName, subject, emailContent, selectedAccount, cc, bcc, recipientList]);

  const handleCancel = () => (hasChanges ? setShowConfirmExit(true) : onClose());
  const handleSaveClick = () => {
    if (!selectedAccount) return alert("⚠️ Seleziona un account di invio prima di salvare.");
    if (ccError || bccError) return alert("⚠️ Correggi gli indirizzi email non validi prima di salvare.");
    setShowConfirmSave(true);
  };

  /* 💾 Conferma salvataggio */
  const confirmSave = async () => {
    setShowConfirmSave(false);
    const updatedCampaign = {
      ...campaign,
      name: campaignName,
      subject,
      content: emailContent,
      recipients: recipientList,
      account: selectedAccount,
      cc,
      bcc,
      attachments,
      updatedAt: new Date().toISOString(),
    };
    await new Promise((r) => setTimeout(r, 800));
    onSave(updatedCampaign);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
    onClose();
  };
  const confirmExit = () => {
    setShowConfirmExit(false);
    onClose();
  };

  /* ------------------------- RENDER ------------------------- */
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-lg animate-fadeZoomIn">
        <h3 className="text-xl font-bold mb-6">✏️ Modifica Campagna</h3>

        {/* ... tutto il contenuto del form, allegati e pulsanti come nel codice precedente ... */}

        {showImage && (
          <div
            className={`fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] backdrop-blur-sm ${imageAnim}`}
            onClick={() => setPreviewImage(null)}
          >
            <div className={`relative ${imageAnim}`}>
              <img
                src={previewImage}
                alt="Anteprima"
                className="max-w-[90vw] max-h-[85vh] rounded-lg shadow-2xl transition-transform duration-300"
              />
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {showPdf && (
          <div
            className={`fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] backdrop-blur-sm ${pdfAnim}`}
            onClick={() => setPreviewPdf(null)}
          >
            <div
              className={`relative bg-white rounded-lg shadow-2xl max-w-[90vw] max-h-[90vh] overflow-hidden ${pdfAnim}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between bg-gray-100 border-b border-gray-200 px-4 py-2 sticky top-0 z-10">
                <span className="text-gray-700 text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-500" />
                  Anteprima PDF
                </span>
                <div className="flex items-center gap-3">
                  <a href={previewPdf} download className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                    <Download className="w-4 h-4" /> Scarica
                  </a>
                  <a
                    href={previewPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 hover:text-gray-900 text-sm font-medium flex items-center gap-1"
                  >
                    <ExternalLink className="w-4 h-4" /> Apri
                  </a>
                  <button onClick={() => setPreviewPdf(null)} className="text-gray-500 hover:text-red-500 text-sm font-medium flex items-center gap-1">
                    <X className="w-4 h-4" /> Chiudi
                  </button>
                </div>
              </div>
              <iframe src={previewPdf} title="Anteprima PDF" className="w-[80vw] h-[80vh] border-0"></iframe>
            </div>
          </div>
        )}
              {/* ✅ Notifica caricamento campagna */}
              {showLoadMessage && (
                  <div className="fixed top-6 right-6 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fadeZoomIn">
                      🔄 Dati campagna caricati correttamente
                  </div>
              )}

        {showSuccess && (
          <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg animate-fadeIn">
            ✅ Campagna aggiornata correttamente
          </div>
        )}
      </div>
    </div>
  );
};
