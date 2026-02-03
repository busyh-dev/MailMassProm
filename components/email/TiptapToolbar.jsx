import React, { useState, useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  Image,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code,
  Highlighter,
  Palette,
  Eraser,
  ExternalLink,
  X,
  Edit3,
} from "lucide-react";
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const ToolbarButton = ({ onClick, icon, tooltip, active }) => (
  <button
    onClick={onClick}
    className={`p-2 rounded transition-colors ${
      active ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 text-gray-700"
    }`}
    title={tooltip}
    type="button"
  >
    {icon}
  </button>
);

const Divider = () => <div className="h-5 w-px bg-gray-300 mx-2"></div>;

export default function TiptapToolbar({ editor }) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkPopup, setLinkPopup] = useState(null);
  const [fontSizeValue, setFontSizeValue] = useState("16");
  const [isApplying, setIsApplying] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!editor) return;
    const updateLinkPopup = () => {
      const attrs = editor.getAttributes("link");
      if (attrs?.href) setLinkPopup({ href: attrs.href });
      else setLinkPopup(null);
    };
    editor.on("selectionUpdate", updateLinkPopup);
    editor.on("transaction", updateLinkPopup);
    return () => {
      editor.off("selectionUpdate", updateLinkPopup);
      editor.off("transaction", updateLinkPopup);
    };
  }, [editor]);

  // 🔤 TANTI FONT DISPONIBILI
  const fonts = [
    { label: "Predefinito", value: "" },
    { label: "Arial", value: "Arial, sans-serif" },
    { label: "Helvetica", value: "Helvetica, sans-serif" },
    { label: "Verdana", value: "Verdana, sans-serif" },
    { label: "Tahoma", value: "Tahoma, sans-serif" },
    { label: "Trebuchet MS", value: "Trebuchet MS, sans-serif" },
    { label: "Georgia", value: "Georgia, serif" },
    { label: "Times New Roman", value: "Times New Roman, serif" },
    { label: "Garamond", value: "Garamond, serif" },
    { label: "Courier New", value: "Courier New, monospace" },
    { label: "Lucida Console", value: "Lucida Console, monospace" },
    { label: "Roboto", value: "Roboto, sans-serif" },
    { label: "Open Sans", value: "Open Sans, sans-serif" },
    { label: "Lato", value: "Lato, sans-serif" },
    { label: "Poppins", value: "Poppins, sans-serif" },
    { label: "Montserrat", value: "Montserrat, sans-serif" },
    { label: "Raleway", value: "Raleway, sans-serif" },
    { label: "Playfair Display", value: "Playfair Display, serif" },
    { label: "Merriweather", value: "Merriweather, serif" },
    { label: "Oswald", value: "Oswald, sans-serif" },
  ];

  const textStyles = [
    { label: "Paragrafo", action: () => editor.chain().focus().setParagraph().run() },
    { label: "Titolo 1", action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: "Titolo 2", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "Citazione", action: () => editor.chain().focus().toggleBlockquote().run() },
  ];

  const handleFontChange = (e) => {
    editor.chain().focus().setFontFamily(e.target.value).run();
  };

  // 📏 Input manuale per la dimensione
  const handleFontSizeInput = (e) => {
    const value = e.target.value;
    setFontSizeValue(value);
    if (!isNaN(value) && value.trim() !== "") {
      editor.chain().focus().setMark("textStyle", { fontSize: `${value}px` }).run();
    }
  };

  const handleClearFormatting = () => {
    editor.chain().focus().unsetAllMarks().clearNodes().run();
  };

  const handleOpenLinkModal = () => {
    const existingLink = editor.getAttributes("link").href || "";
    setLinkUrl(existingLink);
    setShowLinkModal(true);
  };

  // ✅ Attiva/disattiva lista puntata
  const onToggleBullet = () => {
    editor.chain().focus().toggleBulletList().run();
  };

  // ✅ Attiva/disattiva lista numerata
  const onToggleOrdered = () => {
    editor.chain().focus().toggleOrderedList().run();
  };

  const handleRemoveLink = () => {
    editor.chain().focus().unsetLink().run();
    setShowLinkModal(false);
    setLinkUrl("");
  };

  // ✅ Validazione professionale dei link
  const isValidUrl = (url) => {
    try {
      const parsed = new URL(url.trim());
      const forbiddenHosts = ["localhost", "127.0.0.1", "::1"];
      const isLocal = forbiddenHosts.some((h) => parsed.hostname.includes(h));
      const isValidProtocol = parsed.protocol === "https:" || parsed.protocol === "http:";
      const allowedDomains = [".it", ".com", ".eu", ".org", ".net", ".co"];
      const isAllowedDomain = allowedDomains.some((ext) => parsed.hostname.endsWith(ext));
      const isCompanyDomain = parsed.hostname.endsWith("promotergroup.eu");
      return isValidProtocol && !isLocal && (isAllowedDomain || isCompanyDomain);
    } catch {
      return false;
    }
  };

  // 📷 Upload immagine su Supabase Storage
  const handleImageUpload = async (file) => {
    if (!file) return;

    // Validazione tipo file
    if (!file.type.startsWith('image/')) {
      toast.error('⚠️ Carica solo file immagine');
      return;
    }

    // Validazione dimensione (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('⚠️ L\'immagine deve essere inferiore a 5MB');
      return;
    }

    try {
      setIsUploadingImage(true);
      toast.loading('📤 Caricamento immagine...', { id: 'image-upload' });

      // Genera nome file unico
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `campaign-images/${fileName}`;

      // 📤 Upload su Supabase Storage
      const { data, error } = await supabase.storage
        .from('campaign-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // 🔗 Ottieni URL pubblico
      const { data: { publicUrl } } = supabase.storage
        .from('campaign-images')
        .getPublicUrl(filePath);

      // ✅ Inserisci immagine nell'editor
      if (publicUrl) {
        editor.chain().focus().setImage({ src: publicUrl }).run();
        toast.success('✅ Immagine caricata con successo', { id: 'image-upload' });
      }

    } catch (error) {
      console.error('❌ Errore upload immagine:', error);
      toast.error('Errore nel caricamento dell\'immagine', { id: 'image-upload' });
    } finally {
      setIsUploadingImage(false);
      // Reset input per permettere di caricare lo stesso file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 p-2 bg-gray-50 rounded-t-lg">
      {/* 🧱 Tipo di testo */}
      <select
        onChange={(e) => {
          const selected = textStyles.find((s) => s.label === e.target.value);
          selected?.action();
        }}
        className="border border-gray-300 text-sm rounded px-2 py-1 mr-2"
        title="Tipo di testo"
      >
        {textStyles.map((style) => (
          <option key={style.label} value={style.label}>
            {style.label}
          </option>
        ))}
      </select>

      <Divider />

      {/* 🔤 Font */}
      <select
        onChange={handleFontChange}
        className="border border-gray-300 text-sm rounded px-2 py-1 mr-2"
        title="Font"
      >
        {fonts.map((font) => (
          <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
            {font.label}
          </option>
        ))}
      </select>

      {/* 📏 Dimensione (input libero) */}
      <div className="flex items-center gap-1">
        <input
          type="number"
          min="8"
          max="72"
          value={fontSizeValue}
          onChange={handleFontSizeInput}
          className="w-16 border border-gray-300 text-sm rounded px-2 py-1 mr-1 text-center"
          title="Dimensione testo (px)"
        />
        <span className="text-xs text-gray-600">px</span>
      </div>

      <Divider />

      {/* 🎨 Colori */}
      <label
        title="Colore testo"
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
      >
        <Palette size={16} />
        <input
          type="color"
          onInput={(e) => editor.chain().focus().setColor(e.target.value).run()}
          className="w-6 h-6 cursor-pointer bg-transparent border-none"
        />
      </label>

      <label
        title="Evidenzia testo"
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
      >
        <Highlighter size={16} />
        <input
          type="color"
          onInput={(e) =>
            editor.chain().focus().toggleHighlight({ color: e.target.value }).run()
          }
          className="w-6 h-6 cursor-pointer bg-transparent border-none"
        />
      </label>

      <Divider />

      {/* ✏️ Formattazione base */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} icon={<Bold size={16} />} tooltip="Grassetto" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} icon={<Italic size={16} />} tooltip="Corsivo" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} icon={<Underline size={16} />} tooltip="Sottolineato" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} icon={<Code size={16} />} tooltip="Codice" />

      <Divider />

      {/* 📋 Liste */}
      <ToolbarButton
        onClick={onToggleBullet}
        icon={<List size={16} />}
        tooltip="Lista puntata"
      />
      <ToolbarButton
        onClick={onToggleOrdered}
        icon={<ListOrdered size={16} />}
        tooltip="Lista numerata"
      />

      <Divider />

      {/* 🧭 Allineamento */}
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} icon={<AlignLeft size={16} />} tooltip="Allinea a sinistra" />
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} icon={<AlignCenter size={16} />} tooltip="Allinea al centro" />
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} icon={<AlignRight size={16} />} tooltip="Allinea a destra" />

      <Divider />

      {/* 🔗 Inserimenti */}
      <ToolbarButton 
        onClick={handleOpenLinkModal} 
        icon={<LinkIcon size={16} />} 
        tooltip="Inserisci o modifica link" 
        active={editor?.isActive("link")} 
      />

      {/* 📷 Upload Immagine */}
      <button
        type="button"
        onClick={handleImageClick}
        disabled={isUploadingImage}
        className={`p-2 rounded transition-colors ${
          isUploadingImage 
            ? 'bg-blue-100 text-blue-600 cursor-wait' 
            : 'hover:bg-gray-100 text-gray-700'
        }`}
        title="Inserisci immagine"
      >
        {isUploadingImage ? (
          <div className="animate-spin">
            <Image size={16} />
          </div>
        ) : (
          <Image size={16} />
        )}
      </button>

      {/* Input file nascosto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <Divider />

      {/* 🧹 Pulisci formattazione */}
      <ToolbarButton onClick={handleClearFormatting} icon={<Eraser size={16} />} tooltip="Pulisci formattazione" />

      {/* --- MODALE LINK --- */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm border border-gray-200 transition-all">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {editor.isActive("link") ? "Modifica link" : "Inserisci link"}
            </h3>

            {/* 🔗 Campo URL con icona e tooltip */}
            <div className="relative">
              <input
                type="url"
                placeholder="https://www.esempio.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className={`w-full border-2 rounded-lg p-2 pr-10 focus:ring-2 transition-all duration-200 outline-none
                  ${
                    !linkUrl
                      ? "border-gray-300 focus:ring-blue-200"
                      : isValidUrl(linkUrl)
                      ? "border-green-500 focus:ring-green-300"
                      : "border-red-500 focus:ring-red-200"
                  }`}
              />

              {/* ✅❌ Icona con tooltip */}
              {linkUrl && (
                <div className="absolute right-3 top-2.5 group">
                  {isValidUrl(linkUrl) ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="w-5 h-5 text-green-600 animate-scaleIn cursor-default"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="absolute bottom-6 right-0 bg-green-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm whitespace-nowrap">
                        Link valido
                      </span>
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="w-5 h-5 text-red-600 animate-scaleIn cursor-default"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                      <span className="absolute bottom-6 right-0 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm whitespace-nowrap">
                        Link non valido
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 🔴 Messaggio di errore */}
            {linkUrl && !isValidUrl(linkUrl) && (
              <p className="text-red-600 text-sm mt-2">
                ❌ Inserisci un link valido che inizi con <b>https://</b> e appartenga
                a un dominio professionale (.it, .com, .eu, .org...).
              </p>
            )}

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Annulla
              </button>

              {editor.isActive("link") && (
                <button
                  onClick={() => {
                    editor.chain().focus().unsetLink().run();
                    setShowLinkModal(false);
                    setLinkUrl("");
                  }}
                  className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Rimuovi
                </button>
              )}

              <button
                onClick={async () => {
                  if (!isValidUrl(linkUrl)) return;

                  setIsApplying(true);
                  await new Promise((resolve) => setTimeout(resolve, 800));

                  editor.chain().focus().setLink({ href: linkUrl.trim() }).run();
                  setIsApplying(false);
                  setShowLinkModal(false);
                  setLinkUrl("");
                }}
                disabled={!isValidUrl(linkUrl)}
                className={`px-4 py-2 text-sm flex items-center justify-center gap-2 rounded-lg transition-all duration-300 ${
                  isValidUrl(linkUrl)
                    ? isApplying
                      ? "bg-green-600 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isApplying ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="w-5 h-5 animate-scaleIn"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Applicato</span>
                  </>
                ) : editor.isActive("link") ? (
                  "Aggiorna"
                ) : (
                  "Applica"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- POPUP LINK PREVIEW --- */}
      {linkPopup && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 shadow-lg rounded-lg p-3 flex items-center gap-3 z-50">
          <a href={linkPopup.href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
            <ExternalLink size={14} />
            Apri link
          </a>
          <button onClick={handleOpenLinkModal} className="text-gray-600 hover:text-blue-600 p-1" title="Modifica link">
            <Edit3 size={15} />
          </button>
          <button onClick={handleRemoveLink} className="text-gray-600 hover:text-red-600 p-1" title="Rimuovi link">
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}