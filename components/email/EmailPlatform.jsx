
// ✅ AGGIUNGI QUESTO IMPORT IN CIMA AL FILE
import { useEditorState } from '../../contexts/EditorContext';
import React, { useState, useEffect, useRef, useMemo, memo, useCallback  } from 'react';
import Select from 'react-select';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router'; // ✅ Cambiato qui
import { ToolbarPlugin } from "./EditorToolbar";
import toast, { Toaster } from "react-hot-toast";
import CampaignHeader from "./CampaignHeader";
import { Loader2 } from "lucide-react";
import EmailLogs from "./EmailLogs";
import EmailSettings from "../settings/EmailSettings";
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from "framer-motion";
import { useCampaigns } from '../../hooks/useCampaigns';
import { EditCampaignModal } from "./EditCampaignModal";
import { ConfirmModal } from "./ConfirmModal";
import { useEmailAccounts } from '../../hooks/useEmailAccounts';
import RecipientSelect from './RecipientSelect';
import AddTagModal from "../modals/AddTagModal";
import { useUserSettings } from '../../hooks/useUserSettings';
import { useTags } from "../../hooks/useTags";
// In cima al file EmailPlatform.jsx
import { usePermissions } from '../../src/contexts/PermissionsContext';
// import { Can } from '../components/Can';
// import { usePermissions } from '../contexts/PermissionsContext';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import useQueueCount from "../../hooks/useQueueCount";
import { usePersistentModal } from "../../hooks/usePersistentModal";

import TemplateLibraryModal from "../../components/email/TemplateLibraryModal";
import TemplatePreviewModal from "../../components/email/TemplatePreviewModal";

import {
  Mail,
  X,
  AlertTriangle,
  Users,
  Calendar,
  RefreshCw,
  Send,
  Tag,
  Plus,
  Edit3,
  Trash2,
  MoreVertical,
  Eye,
  EyeOff,
  Printer,
  BarChart3,
  Camera,
  ChevronUp,
  Upload,
  UserCheck,
  Search,
  Copy,
  Briefcase,
  Radio,
  Code,
  UserCog,
  Globe,
  Edit2,
  Lock,
  Shield,
  CheckCircle,
  AlignJustify,
  CheckCircle2,
  List,
  ListOrdered,
  XCircle,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
  Image as ImageIcon,
  Check,
  LogOut,
  Type,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  Filter,
  Download, 
  Bell,
  Link as LinkIcon,
  ArrowDown,
  Paperclip,
  Palette, 
  AlignCenter, 
  AlignLeft, 
  AlignRight,
  AlertCircle,
  FileText,
  ExternalLink,
  RotateCcw,
  ClipboardCopy,
  Smartphone,
  Moon,
  Sun,
  Save,
  GripVertical, // 👈 AGGIUNGILA QUI
  UserPlus
} from 'lucide-react';

// Importa Lexical
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import TiptapEditor from './TiptapEditor';
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { $getRoot } from "lexical";
import ImportContactsModal from "./ImportContactsModal";
import SuccessModal from "../common/SuccessModal"; // 🔹 importa il componente


// const [showSuccessModal, setShowSuccessModal] = useState(false);
// const [successType, setSuccessType] = useState("success");
// const [successMessage, setSuccessMessage] = useState("");
// 🆕 Importa l'hook useProfile
import { useProfile } from '../../hooks/useProfile';
import ProfileSettings from '../ProfileSettings';



function App() {
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowProfileModal(true)}>
        Apri Profilo
      </button>

      <ProfileSettings 
        showProfileModal={showProfileModal}
        setShowProfileModal={setShowProfileModal}
      />
    </div>
  );
}



{/* <div className="flex justify-end items-center gap-2 mb-4">
  <button
    onClick={() => setViewMode("grid")}
    className={`px-3 py-2 rounded-lg text-sm border ${
      viewMode === "grid"
        ? "bg-blue-600 text-white border-blue-600"
        : "bg-white text-gray-700 border-gray-300"
    }`}
  >
    Griglia
  </button>

  <button
    onClick={() => setViewMode("table")}
    className={`px-3 py-2 rounded-lg text-sm border ${
      viewMode === "table"
        ? "bg-blue-600 text-white border-blue-600"
        : "bg-white text-gray-700 border-gray-300"
    }`}
  >
    Lista
  </button>
</div> */}

{/* ======================= */}
{/*   VISTA A GRIGLIA       */}
{/* ======================= */}
// {viewMode === "grid" && (
//   <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
//     {loading ? (
//       <p className="text-gray-500">Caricamento campagne…</p>
//     ) : campaigns.length > 0 ? (
//       campaigns.map((campaign) => {
//         const recipients = Array.isArray(campaign.recipients)
//           ? campaign.recipients.length
//           : campaign.total_recipients || 0;

//         const date = campaign.sent_at || campaign.created_at;
//         const formattedDate = date
//           ? new Date(date).toLocaleString("it-IT", {
//               day: "2-digit",
//               month: "short",
//               year: "numeric",
//               hour: "2-digit",
//               minute: "2-digit",
//             })
//           : "-";

//         return (
//           <div
//             key={campaign.id}
//             className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative"
//           >
//             {/* Checkbox selezione */}
//             <div className="absolute top-4 left-4">
//               <input
//                 type="checkbox"
//                 checked={selected.includes(campaign.id)}
//                 onChange={() => toggleSelect(campaign.id)}
//                 className="w-5 h-5"
//               />
//             </div>

//             {/* Titolo + Stato */}
//             <div className="flex justify-between items-start">
//               <div>
//                 <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
//                 <p className="text-sm text-gray-600">{campaign.subject}</p>
//               </div>

//               <span
//                 className={`px-2 py-1 rounded-full text-xs font-semibold ${
//                   campaign.status === "sent"
//                     ? "bg-green-100 text-green-700"
//                     : campaign.status === "scheduled"
//                     ? "bg-indigo-100 text-indigo-700"
//                     : "bg-yellow-100 text-yellow-700"
//                 }`}
//               >
//                 {campaign.status === "sent"
//                   ? "Inviata"
//                   : campaign.status === "scheduled"
//                   ? "Programm."
//                   : "Bozza"}
//               </span>
//             </div>

//             {/* Info */}
//             <div className="mt-4 space-y-1 text-sm">
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Destinatari:</span>
//                 <span>{recipients}</span>
//               </div>

//               <div className="flex justify-between">
//                 <span className="text-gray-600">Aperture:</span>
//                 <span>{campaign.opened_count || 0}</span>
//               </div>

//               <div className="flex justify-between">
//                 <span className="text-gray-600">Data:</span>
//                 <span>{formattedDate}</span>
//               </div>
//             </div>

//             {/* Pulsanti */}
//             <div className="flex flex-col gap-2 mt-5">
//               <button
//                 onClick={() => {
//                   setSelectedCampaign(campaign);
//                   setShowViewModal(true);
//                 }}
//                 className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm"
//               >
//                 Vedi
//               </button>

//               <button
//                 onClick={() => {
//                   setSelectedCampaign(campaign);
//                   setShowEditModal(true);
//                 }}
//                 className="w-full bg-gray-100 hover:bg-gray-200 py-2 rounded-lg text-sm"
//               >
//                 Modifica
//               </button>

//               {campaign.status === "draft" ? (
//                 <button
//                   onClick={() => handleSendCampaign(campaign)}
//                   className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm"
//                 >
//                   Invia
//                 </button>
//               ) : (
//                 <button
//                   onClick={() => handleResendCampaign(campaign)}
//                   className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm"
//                 >
//                   Re-invia
//                 </button>
//               )}

//               <button
//                 onClick={() => {
//                   setSelectedCampaign(campaign);
//                   setShowDeleteConfirm(true);
//                 }}
//                 className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm"
//               >
//                 Elimina
//               </button>
//             </div>
//           </div>
//         );
//       })
//     ) : (
//       <p className="text-gray-500 italic col-span-full">
//         Nessuna campagna disponibile.
//       </p>
//     )}
//   </div>
// )}

// ===============================
// COMPONENTE: CampaignsGrid
// ===============================
const CampaignsGrid = ({
  campaigns,
  setSelectedCampaign,
  setShowEditModal,
  setShowDeleteConfirm,
  handleSendCampaign,
  handleResendCampaign,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {campaigns.length === 0 ? (
        <p className="text-gray-500 italic col-span-full">Nessuna campagna disponibile.</p>
      ) : (
        campaigns.map((campaign) => {
          const recipients = Array.isArray(campaign.recipients)
            ? campaign.recipients.length
            : campaign.total_recipients || 0;

          const rawDate = campaign.sent_at || campaign.created_at;
          const formattedDate = rawDate
            ? new Date(rawDate).toLocaleString("it-IT", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-";

          return (
            <div
              key={campaign.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              {/* Header: titolo + stato */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                  <p className="text-sm text-gray-600">{campaign.subject}</p>
                </div>

                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    campaign.status === "sent"
                      ? "bg-green-100 text-green-700"
                      : campaign.status === "scheduled"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {campaign.status === "sent"
                    ? "Inviata"
                    : campaign.status === "scheduled"
                    ? "Programm."
                    : "Bozza"}
                </span>
              </div>

              {/* Info */}
              <div className="mt-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Destinatari:</span>
                  <span>{recipients}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Aperture:</span>
                  <span>{campaign.opened_count || 0}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Data:</span>
                  <span>{formattedDate}</span>
                </div>
              </div>

              {/* Bottoni */}
              <div className="flex flex-col gap-2 mt-5">
                <button
                  onClick={() => {
                    setSelectedCampaign(campaign);
                    setShowEditModal(true);
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 py-2 rounded-lg text-sm"
                >
                  Modifica
                </button>

                <button
                  onClick={() => handleResendCampaign(campaign)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm"
                >
                  Re-invia
                </button>

                <button
                  onClick={() => {
                    setSelectedCampaign(campaign);
                    setShowDeleteConfirm(true);
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm"
                >
                  Elimina
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};


// ===============================
// COMPONENTE: CampaignsTable
// ===============================
const CampaignsTable = ({
  campaigns,
  setSelectedCampaign,
  setShowEditModal,
  setShowDeleteConfirm,
  setShowCampaignModal,
  handleSendCampaign,
  handleResendCampaign,
}) => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("sent_at");
  const [sortDir, setSortDir] = useState("desc");

  const [selectedRows, setSelectedRows] = useState(new Set());
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // ----------------------
  // FILTRI + RICERCA
  // ----------------------
  const filtered = campaigns.filter((c) => {
    const matchesSearch =
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.subject?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "sent"
        ? c.status === "sent"
        : filterStatus === "draft"
        ? c.status === "draft"
        : filterStatus === "last30"
        ? (c.sent_at || c.created_at) &&
          new Date(c.sent_at || c.created_at) >=
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        : true;

    return matchesSearch && matchesStatus;
  });

  // ----------------------
  // ORDINAMENTO
  // ----------------------
  const sorted = [...filtered].sort((a, b) => {
    const x = a[sortKey];
    const y = b[sortKey];

    if (!x) return 1;
    if (!y) return -1;

    const cmp = new Date(x) - new Date(y);
    return sortDir === "asc" ? cmp : -cmp;
  });

  // ----------------------
  // PAGINAZIONE
  // ----------------------
  const totalPages = Math.ceil(sorted.length / perPage);
  const start = (page - 1) * perPage;
  const shown = sorted.slice(start, start + perPage);

  // ----------------------
  // FUNZIONI DI MASSA
  // ----------------------
  const toggleRow = (id) => {
    const setCopy = new Set(selectedRows);
    if (setCopy.has(id)) setCopy.delete(id);
    else setCopy.add(id);
    setSelectedRows(setCopy);
  };

  const toggleAll = () => {
    const setCopy = new Set(selectedRows);

    const idsOnPage = shown.map((c) => c.id);
    const allSelected = idsOnPage.every((id) => setCopy.has(id));

    if (allSelected) {
      idsOnPage.forEach((id) => setCopy.delete(id));
    } else {
      idsOnPage.forEach((id) => setCopy.add(id));
    }

    setSelectedRows(setCopy);
  };

  // ----------------------
  // ESPORTA CSV
  // ----------------------
  const exportCSV = () => {
    let rows = [
      ["ID", "Nome", "Oggetto", "Stato", "Destinatari", "Inviate", "Fallite", "Data"],
    ];

    sorted.forEach((c) =>
      rows.push([
        c.id,
        c.name,
        c.subject,
        c.status,
        c.total_recipients || 0,
        c.sent_count || 0,
        c.failed_count || 0,
        c.sent_at || c.created_at,
      ])
    );

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((e) => e.join(";")).join("\n");

    const a = document.createElement("a");
    a.setAttribute("href", csvContent);
    a.setAttribute("download", "campagne.csv");
    a.click();
  };

  // ----------------------
  // CAMBIO ORDINAMENTO
  // ----------------------
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortIcon = (key) =>
    sortKey === key ? (sortDir === "asc" ? "▲" : "▼") : "⇅";

  return (
    <div className="space-y-6 p-4">

      {/* FILTRI + RICERCA + EXPORT */}
      <div className="flex flex-wrap gap-3 items-center justify-between">

        {/* FILTRI */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1 rounded-lg text-sm ${
              filterStatus === "all" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Tutte
          </button>

          <button
            onClick={() => setFilterStatus("sent")}
            className={`px-3 py-1 rounded-lg text-sm ${
              filterStatus === "sent" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Inviate
          </button>

          <button
            onClick={() => setFilterStatus("draft")}
            className={`px-3 py-1 rounded-lg text-sm ${
              filterStatus === "draft" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Bozze
          </button>

          <button
            onClick={() => setFilterStatus("last30")}
            className={`px-3 py-1 rounded-lg text-sm ${
              filterStatus === "last30" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Ultimi 30gg
          </button>
        </div>

        {/* RICERCA */}
        <input
          type="text"
          placeholder="Cerca campagne..."
          className="border p-2 rounded-lg w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* EXPORT */}
        <button
          onClick={exportCSV}
          className="bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          Esporta CSV
        </button>
      </div>

      {/* TABELLA */}
      <div className="bg-white border rounded-xl shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-sm text-gray-600">
            <tr>
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  onChange={toggleAll}
                  checked={shown.every((c) => selectedRows.has(c.id))}
                />
              </th>

              <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort("name")}>
                Campagna {sortIcon("name")}
              </th>

              <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort("status")}>
                Stato {sortIcon("status")}
              </th>

              <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort("total_recipients")}>
                Destinatari {sortIcon("total_recipients")}
              </th>

              <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort("sent_at")}>
                Data {sortIcon("sent_at")}
              </th>

              <th className="px-6 py-3">Azioni</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {shown.map((c) => {
              const date = c.sent_at || c.created_at;
              const formatted = date
                ? new Date(date).toLocaleString("it-IT")
                : "-";

              return (
                <tr key={c.id}>
                  <td className="px-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(c.id)}
                      onChange={() => toggleRow(c.id)}
                    />
                  </td>

                  <td className="px-6 py-4">{c.name}</td>
                  <td className="px-6 py-4 capitalize">{c.status}</td>
                  <td className="px-6 py-4">{c.total_recipients || 0}</td>
                  <td className="px-6 py-4">{formatted}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedCampaign(c);
                          setShowEditModal(true);
                        }}
                        className="text-blue-600"
                      >
                        Modifica
                      </button>

                      <button
                        onClick={() => {
                          setSelectedCampaign(c);
                          setShowDeleteConfirm(true);
                        }}
                        className="text-red-600"
                      >
                        Elimina
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* PAGINAZIONE */}
        <div className="flex justify-between items-center p-4 bg-gray-50 border-t">
          <div className="flex items-center gap-2">
            <span>Mostra</span>
            <select
              className="border px-2 py-1 rounded"
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>per pagina</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              className={`px-3 py-1 rounded ${
                page === 1 ? "opacity-40" : "hover:bg-gray-200"
              }`}
              onClick={() => setPage(page - 1)}
            >
              ←
            </button>

            <span>
              Pagina {page} di {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              className={`px-3 py-1 rounded ${
                page === totalPages ? "opacity-40" : "hover:bg-gray-200"
              }`}
              onClick={() => setPage(page + 1)}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// --------------------- OPZIONI TAG ---------------------
// const tagOptions = [
//   { value: "cliente", label: "Cliente" },
//   { value: "prospect", label: "Prospect" },
//   { value: "premium", label: "Premium" },
//   { value: "fornitore", label: "Fornitore" },
//   { value: "partner", label: "Partner" },
// ];
const handleAddTag = async (tagData) => {
  const result = await createTag(tagData);
  if (result.success) {
    toast.success(`✅ Tag "${tagData.label}" creato!`);
    setShowAddTagModal(false);
  } else {
    toast.error(`❌ Errore: ${result.error}`);
  }
  return result;
};


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

const EmailPlatform = () => {
   // 1. Inizializzazione dello stato dell'editor (recuperato dal localStorage)
   const [editorState, setEditorState] = useState({});
   useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('editorState');
      if (saved) setEditorState(JSON.parse(saved));
    }
  }, []);

  // 2. Effetto per salvare e recuperare lo stato dell'editor
  useEffect(() => {
    // Salva lo stato ogni volta che cambia
    if (editorState) {
      console.log('Salvando stato dell\'editor:', editorState);
      localStorage.setItem('editorState', JSON.stringify(editorState));
    }
  }, [editorState]); // Triggera ogni volta che editorState cambia
  
  
  // ========================================
  // 1️⃣ HOOKS (SEMPRE PER PRIMI)
  // ========================================
  const router = useRouter();
  const { user } = useAuth();
  const { 
    isAdmin, 
    isSuperAdmin, 
    role, 
    profile, 
    loading: permissionsLoading  // 👈 Rinominato
  } = usePermissions();


  const [registerMessage, setRegisterMessage] = useState(null);
// Aggiungi questo state se non ce l'hai già
const [currentUser, setCurrentUser] = useState(null);
  // ========================================
  // 2️⃣ STATI
  // ========================================
  const [rejectedUsers, setRejectedUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
   const [campaigns, setCampaigns] = useState([]);
  const queueCount = useQueueCount();
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table"); // "table" | "grid"
  const [showViewModal, setShowViewModal] = useState(false);
  const [latestLogs, setLatestLogs] = useState([]);
  const [latestLogsLoading, setLatestLogsLoading] = useState(true);
  const [logsFromDb, setLogsFromDb] = useState([]);
  const [sending, setSending] = useState(false)
  const [showConfirmSend, setShowConfirmSend] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(""); // ✅ Aggiungi questo
  const [recipientList, setRecipientList] = useState([]); // ✅ Aggiungi anche questo se manca
  const [subject, setSubject] = useState(""); // ✅ Aggiungi anche questo se manca
  const [emailContent, setEmailContent] = useState(""); // ✅ Aggiungi anche questo se manca
  const [cc, setCc] = useState(""); // ✅ Aggiungi anche questo se manca
  const [bcc, setBcc] = useState(""); // ✅ Aggiungi anche questo se manca
  const [attachmentsData, setAttachmentsData] = useState([]); // ✅ Aggiungi anche questo se manca
  const [showConfirmSendCampaign, setShowConfirmSendCampaign] = useState(false);
  const [campaignToSend, setCampaignToSend] = useState(null);
  const [sendingCampaign, setSendingCampaign] = useState(false);
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  // Aggiungi questo stato all'inizio del componente
const [selectedLogForModal, setSelectedLogForModal] = useState(null);
const [emailLogs, setEmailLogs] = useState([]);
const [profileLoaded, setProfileLoaded] = useState(false);
const [showApproveModal, setShowApproveModal] = useState(false);
const [userToApprove, setUserToApprove] = useState(null);
// const [editingContact, setEditingContact] = useState(null);
// State
const [tagOptions, setTagOptions] = useState([]);
const [lastContactsLength, setLastContactsLength] = useState(0);

// Aggiungi questi stati dopo gli altri useState
const [activeProfileTab, setActiveProfileTab] = useState('info-profilo');
const [pendingUsers, setPendingUsers] = useState([]);
const [approvedUsers, setApprovedUsers] = useState([]);
const [availableRoles, setAvailableRoles] = useState([]);
const [loadingUsers, setLoadingUsers] = useState(false);
// State per il modal di rifiuto
const [showRejectModal, setShowRejectModal] = useState(false);
const [userToReject, setUserToReject] = useState(null);
const [showSectorsModal, setShowSectorsModal] = useState(false);
const [showChannelsModal, setShowChannelsModal] = useState(false);
const [showRolesModal, setShowRolesModal] = useState(false);
const [sectors, setSectors] = useState([]);
const [channels, setChannels] = useState([]);
const [roles, setRoles] = useState([]);
  // logsFromDb = risultato della query supabase su email_logs
const uniqueByCampaign = Object.values(
  logsFromDb.reduce((acc, log) => {
    if (!acc[log.campaign_id]) {
      acc[log.campaign_id] = log;
    }
    return acc;
  }, {})
).slice(0, 3);

// 👇 ADATTAMENTO AL TUO TEMPLATE (QUESTO È IL BLOCCO CHE HAI SCRITTO)
const logs = uniqueByCampaign.map(log => ({
  id: log.campaign_id,
  subject: log.subject,
  sentAt: log.sent_at,
  recipients: Array(log.total_recipients).fill("x"),
  opened: log.opened_count,
  status: "sent"
}));


// Aggiungi queste funzioni per gestire utenti e ruoli
const fetchPendingUsers = async () => {
  console.log('🔄 Caricamento utenti in attesa...');
  setLoadingUsers(true);
    
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('status', ['pending', 'approved', 'rejected'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log('✅ Dati ricevuti:', data);
    console.log('📊 Status degli utenti:', data?.map(u => ({ name: u.full_name, status: u.status })));
    
    setPendingUsers(data || []);
  } catch (error) {
    console.error('❌ Errore:', error);
    toast.error('Errore nel caricamento');
  } finally {
    setLoadingUsers(false);
  }
};
// Aggiungi questa funzione
const fetchRejectedUsers = async () => {
  console.log('🔄 INIZIO - Caricamento utenti rifiutati...');
  setLoadingUsers(true);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'rejected')
      .order('updated_at', { ascending: false });

    console.log('📋 DATA ricevuta:', data);
    console.log('❌ ERROR:', error);

    if (error) throw error;

    console.log('✅ Setting rejectedUsers con:', data);
    setRejectedUsers(data || []);
    console.log('✅ FINE - rejectedUsers aggiornato');
  } catch (error) {
    console.error('❌ Errore caricamento utenti rifiutati:', error);
    toast.error('Errore nel caricamento degli utenti rifiutati');
  } finally {
    setLoadingUsers(false);
  }
};

// Carica settori
const fetchSectors = async () => {
  setLoading(true);
  try {
    const { data, error } = await supabase
      .from('sectors')
      .select('*')
      .order('name');  // 🔥 RIMOSSO .eq('user_id', user.id)

    if (error) throw error;
    setSectors(data || []);
  } catch (error) {
    console.error('❌ Errore caricamento settori:', error);
    toast.error('Errore nel caricamento dei settori');
  } finally {
    setLoading(false);
  }
};
// Carica canali
const fetchChannels = async () => {
  try {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .order('name');  // 🔥 RIMOSSO .eq('user_id', user.id)

    if (error) throw error;
    setChannels(data || []);
  } catch (error) {
    console.error('❌ Errore caricamento canali:', error);
  }
};

// Stesso per handleAddSector - rimuovi user_id
const handleAddSector = async () => {
  if (!newSectorName.trim()) {
    toast.error('⚠️ Inserisci un nome per il settore');
    return;
  }

  try {
    const { error } = await supabase
      .from('sectors')
      .insert({
        id: crypto.randomUUID(),
        // 🔥 RIMOSSO user_id: user.id,
        name: newSectorName.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    toast.success('✅ Settore creato con successo!');
    setNewSectorName('');
    await fetchSectors();
  } catch (error) {
    console.error('❌ Errore creazione settore:', error);
    toast.error('Errore nella creazione del settore');
  }
};

// Carica ruoli
const fetchRoles = async () => {
  try {
    const { data, error } = await supabase
      .from('contact_roles')
      .select('*')
      .order('name');  // 🔥 RIMOSSO .eq('user_id', user.id)

    if (error) throw error;
    setRoles(data || []);
  } catch (error) {
    console.error('❌ Errore caricamento ruoli:', error);
  }
};

// E rimuovi il check su user.id dal useEffect
useEffect(() => {
  fetchSectors();
  fetchChannels();
  fetchRoles();
}, []); // 🔥 RIMOSSO user?.id dalla dependency array

const fetchApprovedUsers = async () => {
  setLoadingUsers(true);
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        role:roles (
          id,
          name,
          description
        )
      `)
      .in('status', ['approved', 'active'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    setApprovedUsers(data || []);
  } catch (error) {
    console.error('❌ Errore caricamento utenti approvati:', error);
    toast.error('Errore nel caricamento degli utenti approvati');
  } finally {
    setLoadingUsers(false);
  }
};


// const fetchRoles = async () => {
//   try {
//     const { data, error } = await supabase
//       .from('roles')
//       .select('*')
//       .order('name');

//     if (error) throw error;
//     setAvailableRoles(data || []);
//   } catch (error) {
//     console.error('❌ Errore caricamento ruoli:', error);
//     toast.error('Errore nel caricamento dei ruoli');
//   }
// };

const handleApproveUser = (userId, userName, userEmail) => {
  setUserToApprove({ id: userId, name: userName, email: userEmail });
  setShowApproveModal(true);
};

const confirmApproveUser = async () => {
  if (!userToApprove) return;
  
  try {
    console.log('🔄 Tentativo di approvazione utente:', userToApprove.id);
    
    // 1. Aggiorna lo status in profiles
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', userToApprove.id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Nessun record aggiornato');

    // 2. 🔥 Chiama API backend per confermare email
    try {
      const response = await fetch('/api/confirmUserEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userToApprove.id })
      });

      if (!response.ok) {
        console.warn('⚠️ Errore conferma email via API');
      } else {
        console.log('✅ Email confermata via API');
      }
    } catch (apiError) {
      console.warn('⚠️ API conferma email non disponibile:', apiError);
    }

    toast.success(`✅ Utente ${userToApprove.name} approvato con successo!`);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await Promise.all([
      fetchPendingUsers(),
      fetchRejectedUsers(),
      fetchApprovedUsers()
    ]);
    
    setShowApproveModal(false);
    setUserToApprove(null);
    
  } catch (error) {
    console.error('❌ Errore approvazione completo:', error);
    toast.error(`❌ Errore: ${error.message}`);
  }
};
// Carica l'utente corrente all'avvio del componente
useEffect(() => {
  const loadCurrentUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (authUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          *,
          role:roles (
            name
          )
        `)
        .eq('id', authUser.id)
        .single();
      
      console.log('👤 Current user loaded:', profile);
      console.log('🔑 User role:', profile?.role?.name);
      setCurrentUser(profile);
    }
  };

  loadCurrentUser();
}, []);

const handleChangeUserRole = async (userId, newRoleId, userName) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role_id: newRoleId, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;

    toast.success(`✅ Ruolo aggiornato per ${userName}`);
    fetchApprovedUsers();
  } catch (error) {
    console.error('❌ Errore cambio ruolo:', error);
    toast.error('Errore durante l\'aggiornamento del ruolo');
  }
};

const handleChangeUserStatus = async (userId, newStatus, userName) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;

    toast.success(`✅ Status aggiornato per ${userName}`);
    fetchApprovedUsers();
  } catch (error) {
    console.error('❌ Errore cambio status:', error);
    toast.error('Errore durante l\'aggiornamento dello status');
  }
};


// ✅ Debug permessi
useEffect(() => {
  console.log('🔍 Debug Permessi:', {
    isAdmin,
    isSuperAdmin,
    role: role?.name,
    profile_email: profile?.email,
    loading: permissionsLoading  // 👈 Usa il nome rinominato
  });
}, [isAdmin, isSuperAdmin, role, profile, permissionsLoading]);
// Carica i dati quando si apre il tab impostazioni
useEffect(() => {
  if (activeProfileTab === 'gestione-utenti') {
    fetchPendingUsers();
  }
  
  if (activeProfileTab === 'gestione-permessi') {
    fetchApprovedUsers();
    fetchRoles();
  }
  
  if (activeProfileTab === 'utenti-rifiutati') {
    fetchRejectedUsers();
  }
}, [activeProfileTab]);
// useEffect per caricare i tag all'avvio del componente
useEffect(() => {
  const fetchTags = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;
    
    const { data, error } = await supabase
      .from('tags')
      .select('value, label')
      .eq('user_id', user.id)  // Filtra solo i tag dell'utente loggato
      .order('label');
    
    if (data) {
      console.log('🏷️ Tag caricati:', data);
      const options = data.map(tag => ({
        value: tag.value,
        label: tag.label
      }));
      setTagOptions(options);
    } else {
      console.error('❌ Errore caricamento tag:', error);
    }
  };
  
  fetchTags();
}, []);
// // useEffect per caricare i tag
// useEffect(() => {
//   const fetchTags = async () => {
//     const { data, error } = await supabase
//       .from('tags')
//       .select('id, name')
//       .order('name');
    
//     if (data) {
//       setTagOptions(data.map(tag => ({
//         value: tag.id,
//         label: tag.name
//       })));
//     }
//   };
  
//   fetchTags();
// }, []);


useEffect(() => {
  const loadLatestLogs = async () => {
    const { data } = await supabase
      .from("email_logs")
      .select(`
        campaign_id,
        subject,
        sent_at,
        total_recipients,
        opened_count
      `)
      .eq("user_id", user.id)
      .order("sent_at", { ascending: false });

    setLogsFromDb(data || []);
  };

  if (user?.id) loadLatestLogs();
}, [user?.id]);
// Funzione che apre il modal di conferma rifiuto
const handleRejectUser = (userId, userName, userEmail) => {
  setUserToReject({ id: userId, name: userName, email: userEmail });
  setShowRejectModal(true);
};

// Funzione che conferma ed esegue il rifiuto
const confirmRejectUser = async () => {
  if (!userToReject) return;

  try {
    console.log('🔄 Tentativo di rifiuto utente:', userToReject.id);
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        status: 'rejected', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', userToReject.id)
      .select();

    console.log('✅ Risultato update:', data);

    if (error) throw error;

    toast.success(`✅ Utente ${userToReject.name} rifiutato`);
    
    // Invia email di rifiuto (opzionale)
    try {
      await fetch('/api/sendApprovalEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: userToReject.email,
          userName: userToReject.name,
          approved: false
        })
      });
    } catch (emailError) {
      console.warn('⚠️ Email non inviata:', emailError);
    }

    // Ricarica la lista
    await fetchPendingUsers();
    
    // Chiudi il modal
    setShowRejectModal(false);
    setUserToReject(null);
    
  } catch (error) {
    console.error('❌ Errore rifiuto:', error);
    toast.error(`❌ Errore: ${error.message}`);
  }
};
  // ================================
// 📬 PREPARAZIONE WIDGET "ULTIMI INVII"
// ================================

const latestByCampaign = {};

for (const log of logsFromDb) {
  if (
    !latestByCampaign[log.campaign_id] ||
    new Date(log.sent_at) > new Date(latestByCampaign[log.campaign_id].sent_at)
  ) {
    latestByCampaign[log.campaign_id] = log;
  }
}

useEffect(() => {
  const loadCampaigns = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Errore caricamento campaigns:", error);
    }

    console.log("📋 Campaigns caricate:", data);
    console.log("📊 Campaigns SENT:", data?.filter(c => c.status === 'sent').length); // ✅ DEBUG
    console.log("📋 Prima campagna:", data?.[0]); // ✅ DEBUG

    setCampaigns(data || []);
    setLoading(false);
  };

  // ✅ Aggiungi loadEmailLogs
  const loadEmailLogs = async () => {
    try {
      console.log('📧 Caricamento email_logs...');
      
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      console.log('✅ Email logs caricati:', data?.length);
      console.log('📋 Email logs data:', data);
      
      setEmailLogs(data || []);
    } catch (error) {
      console.error('❌ Errore caricamento email_logs:', error);
      setEmailLogs([]); // Fallback vuoto
    }
  };

  if (user?.id) {
    loadCampaigns();
    loadEmailLogs(); // ✅ Carica anche i log
  }
}, [user?.id]);
// E usa emailLogs nel widget
const latestLogsForWidget = useMemo(() => {
  console.log('🔄 Ricalcolo widget');
  console.log('  - emailLogs:', emailLogs?.length);
  console.log('  - campaigns:', campaigns?.length);
  
  // ✅ Prova prima emailLogs
  if (emailLogs && emailLogs.length > 0) {
    console.log('📧 Uso emailLogs per il widget');
    return emailLogs
      .slice(0, 5)
      .map(log => ({
        id: log.id,
        campaign_name: log.campaign_name || 'Campagna',
        subject: log.subject,
        sent_at: log.sent_at,
        sender_email: log.sender_email,
        recipient_list: log.recipients || [], // Potrebbe chiamarsi 'recipients'
        cc: log.cc || [],
        bcc: log.bcc || [],
        total_recipients: log.total_recipients || 0,
        opened_count: log.opened_count || 0,
        status: log.status || 'sent',
      }));
  }
  
  // ✅ Fallback su campaigns se emailLogs è vuoto
  if (campaigns && campaigns.length > 0) {
    console.log('📋 Uso campaigns per il widget');
    const sentCampaigns = campaigns.filter(c => c.status === 'sent' && c.sent_at);
    
    console.log('  - Campagne sent:', sentCampaigns.length);
    
    return sentCampaigns
      .sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at))
      .slice(0, 5)
      .map(log => ({
        id: log.id,
        campaign_name: log.campaign_name,
        subject: log.subject,
        sent_at: log.sent_at,
        sender_email: log.sender_email,
        recipient_list: log.recipient_list || [],
        cc: log.cc || [],
        bcc: log.bcc || [],
        total_recipients: log.total_recipients || log.recipient_list?.length || 0,
        opened_count: log.opened_count || 0,
        status: 'sent',
      }));
  }
  
  console.log('⚠️ Nessun dato disponibile per il widget');
  return [];
}, [emailLogs, campaigns]); // ✅ Dipende da entrambi
  // ✅ Stato persistente della modalità (standard, template, builder)
// ✅ Stato persistente per la finestra "Nuova Campagna"
const [showCampaignModal, setShowCampaignModal] = useState(() => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("showCampaignModal") === "true";
});
// Costruisci dati invii per mese
const monthlyData = Object.values(
  campaigns.reduce((acc, c) => {
    const rawDate = c.sent_at || c.created_at;

    if (!rawDate) return acc; // ⛔ se manca la data, ignora la campagna

    const date = new Date(rawDate);

    // ⛔ Se la data non è valida, non la usare
    if (isNaN(date.getTime())) return acc;

    const month = date.toLocaleString("it-IT", { month: "short" });

    if (!acc[month]) acc[month] = { month, invii: 0 };
    acc[month].invii += c.sent_count || 0;

    return acc;
  }, {})
);
const confirmSendCampaign = async () => {
  setSendingCampaign(true);

  if (campaignToSend?.id) {
    setSendingId(campaignToSend.id); // ✅ Imposta qui
  }
  
  try {
    console.log('🚀 Invio campagna:', campaignToSend);

    // Trova l'account completo
    const accountObj = accounts.find(acc => acc.email === campaignToSend.sender_email);
    
    if (!accountObj) {
      toast.error("⚠️ Account mittente non trovato");
      setSendingCampaign(false);
      return;
    }

    let successCount = 0;
    let failedCount = 0;

    // ✅ INVIO SMTP
    if (accountObj.provider === "brevo" || accountObj.smtp) {
      const payload = {
        user_id: user.id,
        from: accountObj.email,
        to: campaignToSend.recipient_list,
        cc: campaignToSend.cc || [],
        bcc: campaignToSend.bcc || [],
        subject: campaignToSend.subject,
        html: campaignToSend.email_content,
        attachments: campaignToSend.attachments || [],
        smtp: accountObj.smtp,
      };

      const response = await fetch("/api/send-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      successCount = result.sent;
      failedCount = result.failed || 0;
    }

    // ✅ INVIO RESEND
    if (accountObj.provider === "resend") {
      const payload = {
        apiKey: resendApiKey,
        user_id: user.id,
        from: accountObj.email,
        to: campaignToSend.recipient_list,
        cc: campaignToSend.cc || [],
        bcc: campaignToSend.bcc || [],
        subject: campaignToSend.subject,
        html: campaignToSend.email_content,
        attachments: campaignToSend.attachments || [],
      };

      const response = await fetch("/api/resend/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      successCount = result.sent || campaignToSend.recipient_list.length;
    }

    // ✅ AGGIORNA STATUS
    const { error: updateError } = await supabase
      .from("campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        sent_count: successCount,
        failed_count: failedCount,
      })
      .eq("id", campaignToSend.id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("⚠️ Errore aggiornamento:", updateError);
    }

    await loadCampaigns();

    toast.success(`✅ Campagna inviata a ${successCount} destinatari!`, { duration: 3000 });

    setShowConfirmSendCampaign(false);
    setCampaignToSend(null);

  } catch (error) {
    console.error("💥 Errore:", error);
    toast.error(`❌ ${error.message}`);
  } finally {
    setSendingCampaign(false);
    setSendingId(null); // ✅ Reset qui
  }
};

useEffect(() => {
  console.log('🔍 DEBUG CAMPAIGNS:');
  console.log('  - Totale campaigns:', campaigns?.length);
  console.log('  - Campaigns data:', campaigns);
  console.log('  - Campaigns sent:', campaigns?.filter(c => c.status === 'sent'));
  console.log('  - Campaigns con sent_at:', campaigns?.filter(c => c.sent_at));
}, [campaigns]);
// 📧 Invia una bozza
const handleSendCampaign = (campaign) => {
  console.log('🚀 handleSendCampaign chiamato con:', campaign);
  console.log('📧 sender_email:', campaign.sender_email);
  console.log('📋 recipient_list:', campaign.recipient_list);
  
  // ✅ Validazioni
  if (!campaign.sender_email) {
    toast.error("⚠️ Account mittente non trovato nella campagna");
    setSendingId(null); // ✅ Reset loading
    return;
  }
  
  if (!campaign.recipient_list || campaign.recipient_list.length === 0) {
    toast.error("⚠️ Nessun destinatario trovato nella campagna");
    setSendingId(null); // ✅ Reset loading
    return;
  }
  
  // ✅ Salva la campagna da inviare
  setCampaignToSend(campaign);
  
  // ✅ Apri il modale CAMPAGNA (non quello del form!)
  setShowConfirmSendCampaign(true);
  
  console.log('✅ Modale showConfirmSendCampaign aperto');
};
// Modifica confirmSend per usare campaignToSend
const confirmSend = async () => {
  setSending(true);
  setShowConfirmSend(false);

  try {
    console.log('🚀 confirmSend - Inizio invio');
    
    // ✅ Determina da dove prendere i dati
    const account = selectedAccount; // Dal form "Invia Ora"
    const recipients = recipientList;
    const emailSubject = subject;
    const content = emailContent;
    const emailCc = cc ? cc.split(",").map(e => e.trim()).filter(Boolean) : [];
    const emailBcc = bcc ? bcc.split(",").map(e => e.trim()).filter(Boolean) : [];
    const attachments = attachmentsData || [];

    console.log('📧 Account:', account);
    console.log('📋 Recipients:', recipients);
    console.log('📝 Subject:', emailSubject);

    // ✅ Validazioni
    if (!account) {
      toast.error("⚠️ Seleziona un account di invio");
      setSending(false);
      return;
    }

    if (!recipients || recipients.length === 0) {
      toast.error("⚠️ Aggiungi almeno un destinatario");
      setSending(false);
      return;
    }

    if (!emailSubject) {
      toast.error("⚠️ Inserisci l'oggetto dell'email");
      setSending(false);
      return;
    }

    if (!content) {
      toast.error("⚠️ Il contenuto dell'email è vuoto");
      setSending(false);
      return;
    }

    // Trova l'oggetto account completo
    const accountObj = accounts.find(acc => acc.email === account);
    
    if (!accountObj) {
      toast.error("⚠️ Account non trovato nella lista");
      setSending(false);
      return;
    }

    console.log('✅ Account trovato:', accountObj);

    let successCount = 0;
    let failedCount = 0;

    // ✅ INVIO SMTP
    if (accountObj.provider === "brevo" || accountObj.smtp) {
      console.log('📤 Invio via SMTP...');

      const payload = {
        user_id: user.id,
        from: accountObj.email,
        to: recipients,
        cc: emailCc,
        bcc: emailBcc,
        subject: emailSubject,
        html: content,
        attachments: attachments,
        smtp: accountObj.smtp,
      };

      const response = await fetch("/api/send-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Errore durante l'invio");
      }

      successCount = result.sent;
      failedCount = result.failed || 0;
    }

    // ✅ INVIO RESEND
    if (accountObj.provider === "resend") {
      console.log('📤 Invio via Resend...');

      const payload = {
        apiKey: resendApiKey,
        user_id: user.id,
        from: accountObj.email,
        to: recipients,
        cc: emailCc,
        bcc: emailBcc,
        subject: emailSubject,
        html: content,
        attachments: attachments,
      };

      const response = await fetch("/api/resend/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Errore durante l'invio");
      }

      successCount = result.sent || recipients.length;
    }

    toast.success(`✅ Email inviata a ${successCount} destinatari!`, { duration: 3000 });

    // Reset
    setProgress(100);
    setSentCount(successCount);
    setFailedCount(failedCount);

    setTimeout(() => {
      setProgress(0);
      setSentCount(0);
      setFailedCount(0);
    }, 3000);

  } catch (error) {
    console.error("💥 Errore:", error);
    toast.error(`❌ Errore: ${error.message}`);
  } finally {
    setSending(false);
  }
};

// 📧 Re-invia una campagna già inviata
const handleResendCampaign = (campaign) => {
  setSelectedCampaign(campaign);
  setCampaignMode("resend");
  setShowCampaignModal(true);
};

const [campaignMode, setCampaignMode] = useState(() => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("campaignMode") || null;
});

const handleDuplicateCampaign = async (campaign) => {
  try {
    const recipients = Array.isArray(campaign.recipient_list)
      ? campaign.recipient_list
      : [];

    const payload = {
      campaignName: `${campaign.campaign_name || campaign.name} (Copia)`,
      subject: campaign.subject || "",
      emailContent: campaign.email_content || "<p></p>",
      recipientList: recipients,
      cc: campaign.cc || "",
      bcc: campaign.bcc || "",
      senderEmail: campaign.sender_email || "",
      attachments: campaign.attachments || [],
      totalAttachmentSize: campaign.total_attachment_size || 0,
      trackingEnabled: campaign.tracking_enabled !== false,
      openTracking: campaign.open_tracking !== false,
      clickTracking: campaign.click_tracking !== false,
    };

    const res = await saveCampaign(payload, true); // true = BOZZA

    if (!res.success) throw new Error(res.error);

    toast.success("📄 Campagna duplicata come bozza");
    loadCampaigns();
  } catch (err) {
    console.error(err);
    toast.error("❌ Errore durante la duplicazione");
  }
};


// ✅ Inizializza lo stato dal localStorage all’avvio
useEffect(() => {
  if (typeof window === "undefined") return;

  const savedModal = localStorage.getItem("showCampaignModal") === "true";
  const savedMode = localStorage.getItem("campaignMode");

  setShowCampaignModal(savedModal);
  setCampaignMode(savedMode || null);
}, []);

// ✅ Salva e sincronizza con localStorage
useEffect(() => {
  if (typeof window === "undefined") return;
  localStorage.setItem("showCampaignModal", showCampaignModal);
}, [showCampaignModal]);

useEffect(() => {
  if (typeof window === "undefined") return;
  if (campaignMode) localStorage.setItem("campaignMode", campaignMode);
  else localStorage.removeItem("campaignMode");
}, [campaignMode]);

// ✅ Sincronizza tra tab diverse del browser
useEffect(() => {
  const syncState = (e) => {
    if (e.key === "showCampaignModal") {
      setShowCampaignModal(e.newValue === "true");
    }
    if (e.key === "campaignMode") {
      setCampaignMode(e.newValue || null);
    }
  };
  window.addEventListener("storage", syncState);
  return () => window.removeEventListener("storage", syncState);
}, []);

// ✅ Chiudi automaticamente dopo 15 minuti (se rimane aperta)
useEffect(() => {
  if (!showCampaignModal) return;
  const timer = setTimeout(() => {
    setShowCampaignModal(false);
    setCampaignMode(null);
    localStorage.removeItem("showCampaignModal");
    localStorage.removeItem("campaignMode");
  }, 15 * 60 * 1000);
  return () => clearTimeout(timer);
}, [showCampaignModal]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  // Stato nel componente principale (se non c'è già)
  const [unreadNotifications, setUnreadNotifications] = useState(3); // esempio
   const [showAllNotificationsModal, setShowAllNotificationsModal] = useState(false);
  const [filter, setFilter] = useState('tutte');  
  const [contacts, setContacts] = useState([]);

  const [selected, setSelected] = useState([]); // id delle selezionate
const toggleSelect = (id) => {
  setSelected((prev) =>
    prev.includes(id)
      ? prev.filter((x) => x !== id)
      : [...prev, id]
  );
};

  const editorConfig = {
    namespace: "MailEditor",
    theme: {
    paragraph: "mb-2",
    },
    onError(error) {
    throw error;
    },
    };
  const notifications = [
    {
      id: 1,
      title: "Nuova campagna creata",
      date: "25/09/2025",
      description: "La campagna 'Promo Autunno' è stata avviata con successo.", read: false
    },
    {
      id: 2,
      title: "Risposta ricevuta",
      date: "24/09/2025",
      description: "Un contatto ha risposto alla tua ultima email.", read: false
    },
  ];

// Aggiungi questa funzione nel componente EmailPlatform
const exportResendLog = (format = "csv", autoDownload = false) => {
  const logs = JSON.parse(localStorage.getItem("emailLogs") || "[]");
  
  if (logs.length === 0) {
    toast.error("⚠️ Nessun log disponibile per l'export");
    return;
  }

  if (format === "csv") {
    // Genera CSV
    const headers = ["ID", "Nome Campagna", "Oggetto", "Destinatari", "Aperture", "Stato", "Data Invio"];
    const rows = logs.map(log => [
      log.id,
      log.name,
      log.subject,
      log.recipients,
      log.opened,
      log.status,
      new Date(log.sentAt).toLocaleString()
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    if (autoDownload) {
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `email-logs-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("✅ Log esportati in CSV");
    }

    return csv;
  }
};
  const fetchContacts = async () => {
    if (!user?.id) return;
  
    try {
      console.log('📡 Fetching contacts...');
      const res = await fetch(`/api/contacts?user_id=${user.id}`);
      const result = await res.json();
  
      console.log('📥 Risposta API contacts:', result);
  
      if (result.success) {
        setContacts(result.data || []);
        console.log('✅ Contatti caricati:', result.data?.length || 0, result.data);
      }
    } catch (err) {
      console.error("💥 Errore caricamento contatti:", err);
    }
  };

  useEffect(() => {
    if (contacts.length !== lastContactsLength) {
      console.log('📇 Contacts cambiati:', contacts.length);
      setLastContactsLength(contacts.length);
    }
  }, [contacts.length]); // ← Usa solo la length, non l'intero array
  const CampaignsList = ({ setActiveTab }) => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
  
    const [page, setPage] = useState(1);
    const perPage = 10;
  
    // 🔍 FILTRI E RICERCA
    const [filterStatus, setFilterStatus] = useState("all"); 
    const [searchQuery, setSearchQuery] = useState("");
  
    
    if (loading) {
      return (
        <div className="text-center py-10 text-gray-500">
          Caricamento campagne…
        </div>
      );
    }
  
    // ---------------------------
    // FILTRI
    // ---------------------------
    const applyFilters = () => {
      let filtered = [...campaigns];
  
      // Filter by status
      if (filterStatus === "sent") {
        filtered = filtered.filter((c) => c.status === "sent");
      } else if (filterStatus === "draft") {
        filtered = filtered.filter((c) => c.status !== "sent");
      }
  
      // Ultimi 30 giorni
      if (filterStatus === "last30") {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
  
        filtered = filtered.filter((c) => {
          const date = new Date(c.sent_at || c.created_at);
          return date >= cutoff;
        });
      }
  
      // 🔍 Search filter
      if (searchQuery.trim() !== "") {
        filtered = filtered.filter((c) =>
          `${c.name} ${c.subject}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        );
      }
  
      return filtered;
    };
  // Mantieni connessione Supabase attiva
useEffect(() => {
  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible') {
      console.log('👁️ Finestra tornata attiva');
      
      // Verifica sessione
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.warn('⚠️ Sessione persa');
        router.push('/login');
        return;
      }
      
      // Ricarica dati se modale profilo aperto
      if (showProfileModal && user?.id) {
        console.log('🔄 Ricarico dati profilo...');
        await fetchPendingUsers();
        await fetchRejectedUsers();
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [showProfileModal, user?.id]);

    const filteredCampaigns = applyFilters();
  
    // PAGINAZIONE
    const totalPages = Math.ceil(filteredCampaigns.length / perPage);
    const start = (page - 1) * perPage;
    const slice = filteredCampaigns.slice(start, start + perPage);
  
    return (
      <div className="p-6 space-y-6">
  
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Tutte le Campagne</h2>
  
          <button
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            onClick={() => setActiveTab("dashboard")}
          >
            ← Torna alla Dashboard
          </button>
        </div>
  
        {/* 🔍 RICERCA */}
        <input
          type="text"
          placeholder="Cerca campagna..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
  
        {/* FILTRI */}
        <div className="flex gap-3">
          <button
            className={`px-3 py-2 rounded ${
              filterStatus === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setFilterStatus("all")}
          >
            Tutte
          </button>
  
          <button
            className={`px-3 py-2 rounded ${
              filterStatus === "sent"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setFilterStatus("sent")}
          >
            Inviate
          </button>
  
          <button
            className={`px-3 py-2 rounded ${
              filterStatus === "draft"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setFilterStatus("draft")}
          >
            Bozze
          </button>
  
          <button
            className={`px-3 py-2 rounded ${
              filterStatus === "last30"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setFilterStatus("last30")}
          >
            Ultimi 30 giorni
          </button>
        </div>
  
        {/* TABELLA CAMPAGNE */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs text-gray-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-xs text-gray-500 uppercase">Destinatari</th>
                <th className="px-6 py-3 text-xs text-gray-500 uppercase">Stato</th>
                <th className="px-6 py-3 text-xs text-gray-500 uppercase">Data</th>
              </tr>
            </thead>
  
            <tbody className="bg-white divide-y divide-gray-200">
              {slice.map((c) => {
                const date = c.sent_at || c.created_at;
                const formatted = date
                  ? new Date(date).toLocaleString("it-IT", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-";
  
                return (
                  <tr key={c.id}>
                    <td className="px-6 py-4">{c.name}</td>
                    <td className="px-6 py-4">{c.recipients || 0}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          c.status === "sent"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {c.status === "sent" ? "Inviata" : "Bozza"}
                      </span>
                    </td>
                    <td className="px-6 py-4">{formatted}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
  
          {/* PAGINAZIONE */}
          <div className="flex justify-between items-center px-6 py-3 bg-gray-50 border-t">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className={`px-3 py-2 rounded ${
                page === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:bg-blue-50"
              }`}
            >
              ← Precedente
            </button>
  
            <span className="text-sm text-gray-700">
              Pagina {page} di {totalPages}
            </span>
  
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className={`px-3 py-2 rounded ${
                page === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:bg-blue-50"
              }`}
            >
              Successiva →
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  

const NotificationDropdown = ({
    notifications,
    setNotifications,
    showAllNotificationsModal,
    setShowAllNotificationsModal
  }) => {
    const [showDropdown, setShowDropdown] = useState(false);
  
    const unreadCount = notifications.filter(n => !n.read).length;
  
    const markAllAsRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };
  
    const deleteNotification = (id) => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    };
  };

  const syncCampaignsToStorage = (updatedList) => {
    localStorage.setItem("allCampaigns", JSON.stringify(updatedList));
  };
 
const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
const [showNotificationsModal, setShowNotificationsModal] = useState(false);
const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
const [contactToDeactivate, setContactToDeactivate] = useState(null);

 // 🆕 Stati per conferme - QUESTI MANCAVANO
//  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
 const [hasChanges, setHasChanges] = useState(false);

  // const { user, logout } = useAuth();


  const handleLogout = async () => {
    try {
    await logout();
    } catch (error) {
    console.error('Errore logout:', error);
    }
    };
    
    
    const getUserInitials = (name) => {
    if (!name) return 'MM';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    };
    
    
    // Azioni notifiche
    const filteredNotifications = notifications.filter(n => {
    if (filter === 'non-lette') return !n.read;
    if (filter === 'importanti') return n.important;
    return true;
    });
    
    
    const markSelectedAsRead = () => {
    setNotifications(prev =>
    prev.map(n =>
    selectedNotifications.includes(n.id) ? { ...n, read: true } : n
    )
    );
    setSelectedNotifications([]);
    };
    
    
    const deleteSelected = () => {
    setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)));
    setSelectedNotifications([]);
    };


  function Editor() {
    return (
      <LexicalComposer initialConfig={editorConfig}>
        <div className="border border-gray-300 rounded-lg">
          <ToolbarPlugin />
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-[200px] p-4 outline-none" />
            }
            placeholder={<div className="p-4 text-gray-400">Scrivi qui il contenuto...</div>}
          />
          <HistoryPlugin />
          <OnChangePlugin onChange={() => { }} />
        </div>
      </LexicalComposer>
    );
  }

 // In EmailPlatform (componente padre)
useEffect(() => {
  if (user?.id) {
    console.log('🔍 Caricamento contatti per user:', user.id);
    fetchContacts();
  }
}, [user?.id]); 
  // Carica dati mock solo lato client per evitare errori hydration
  useEffect(() => {
    setIsClient(true);

    // Carica dati mock delle campagne
    setCampaigns([
      {
        id: 1,
        name: 'Newsletter Gennaio 2025',
        subject: 'Le novità del mese',
        status: 'sent',
        recipients: 1250,
        opened: 520,
        clicked: 89,
        created: '2025-01-15',
        sent: '2025-01-16'
      },
      {
        id: 2,
        name: 'Promozione Primavera',
        subject: 'Sconti fino al 50%',
        status: 'draft',
        recipients: 0,
        opened: 0,
        clicked: 0,
        created: '2025-01-18',
        sent: null
      }
    ]);

    // Carica dati mock dei contatti
    setContacts([
      { id: 1, email: 'mario.rossi@email.com', name: 'Mario Rossi', status: 'active', tags: ['cliente', 'premium'] },
      { id: 2, email: 'giulia.verdi@email.com', name: 'Giulia Verdi', status: 'active', tags: ['prospect'] },
      { id: 3, email: 'luca.bianchi@email.com', name: 'Luca Bianchi', status: 'unsubscribed', tags: ['ex-cliente'] }
    ]);
  }, []);


  // Chiudi menu utente quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);



  // Mostra loading fino a quando il componente non è montato lato client
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <Mail className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">MailMassProm</h2>
          <p className="text-gray-500">Caricamento piattaforma...</p>
        </div>
      </div>
    );
  }

  // Componente Dashboard
// =======================
// 📊 DASHBOARD AVANZATA
// =======================
const Dashboard = ({ setActiveTab }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // 📌 1. Campagne dal DB
      const { data: campaignsData, error: campErr } = await supabase
        .from("campaigns")
        .select("*")
        .order("sent_at", { ascending: false });

      if (campErr) {
        console.error("Errore caricamento campagne:", campErr);
      }

      // 📌 2. Contatti dal DB
      const { data: contactsData, error: contErr } = await supabase
        .from("contacts")
        .select("*");

      if (contErr) {
        console.error("Errore caricamento contatti:", contErr);
      }

      setCampaigns(campaignsData || []);
      setContacts(contactsData || []);
      setLoading(false);
    };

    loadData();
  }, []);

  // =========================
  // 🔢 METRICHE PRINCIPALI
  // =========================
  const totalCampaigns = campaigns.length;
  // console.log("📇 contacts:", contacts);
  const activeContacts = contacts.filter(
    c => c.status?.trim().toLowerCase() === "active"
  ).length;
  

  const totalEmailsSent = campaigns.reduce(
    (sum, c) => sum + (c.sent_count || c.total_recipients || 0),
    0
  );

  const totalOpened = campaigns.reduce(
    (sum, c) => sum + (c.opened_count || 0),
    0
  );

  const totalClicked = campaigns.reduce(
    (sum, c) => sum + (c.clicked_count || 0),
    0
  );

  const totalBounced = campaigns.reduce(
    (sum, c) => sum + (c.bounced_count || 0),
    0
  );

  const avgOpenRate =
    totalEmailsSent > 0 ? (totalOpened / totalEmailsSent) * 100 : 0;
  const avgClickRate =
    totalEmailsSent > 0 ? (totalClicked / totalEmailsSent) * 100 : 0;
  const bounceRate =
    totalEmailsSent > 0 ? (totalBounced / totalEmailsSent) * 100 : 0;

  // =========================
  // 📆 AGGREGAZIONI TEMPORALI
  // =========================

  // Helper formattazione "2025-01" → "Gen 2025"
  const formatMonthLabel = (key) => {
    const [y, m] = key.split("-");
    const date = new Date(Number(y), Number(m) - 1, 1);
    return date.toLocaleDateString("it-IT", {
      month: "short",
      year: "2-digit",
    });
  };

  // 🔹 Aggregazione per mese
  const monthlyData = useMemo(() => {
    const map = {};

    campaigns.forEach((c) => {
      const dateRaw = c.sent_at || c.created_at;
      if (!dateRaw) return;
      const d = new Date(dateRaw);
      if (isNaN(d.getTime())) return;

      const key = `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!map[key]) {
        map[key] = {
          key,
          sent: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
        };
      }

      map[key].sent += c.sent_count || c.total_recipients || 0;
      map[key].opened += c.opened_count || 0;
      map[key].clicked += c.clicked_count || 0;
      map[key].bounced += c.bounced_count || 0;
    });

    return Object.values(map)
      .sort((a, b) => (a.key > b.key ? 1 : -1))
      .map((m) => ({
        month: formatMonthLabel(m.key),
        invii: m.sent,
        aperture: m.opened,
        openRate:
          m.sent > 0 ? Number(((m.opened / m.sent) * 100).toFixed(1)) : 0,
        ctr:
          m.sent > 0 ? Number(((m.clicked / m.sent) * 100).toFixed(1)) : 0,
        bounce:
          m.sent > 0 ? Number(((m.bounced / m.sent) * 100).toFixed(1)) : 0,
      }));
  }, [campaigns]);

  // 🔹 Aggregazione per giorno della settimana
  const weeklyData = useMemo(() => {
    const base = [
      { dow: 0, label: "Lun", sent: 0, opened: 0 },
      { dow: 1, label: "Mar", sent: 0, opened: 0 },
      { dow: 2, label: "Mer", sent: 0, opened: 0 },
      { dow: 3, label: "Gio", sent: 0, opened: 0 },
      { dow: 4, label: "Ven", sent: 0, opened: 0 },
      { dow: 5, label: "Sab", sent: 0, opened: 0 },
      { dow: 6, label: "Dom", sent: 0, opened: 0 },
    ];

    campaigns.forEach((c) => {
      const dateRaw = c.sent_at || c.created_at;
      if (!dateRaw) return;
      const d = new Date(dateRaw);
      if (isNaN(d.getTime())) return;

      // JS: 0=Dom...6=Sab → convertiamo a 0=Lun...6=Dom
      const jsDay = d.getDay(); // 0-6
      const mappedIndex = (jsDay + 6) % 7; // Dom (0) → 6, Lun (1) → 0

      base[mappedIndex].sent += c.sent_count || c.total_recipients || 0;
      base[mappedIndex].opened += c.opened_count || 0;
    });

    return base.map((d) => ({
      day: d.label,
      invii: d.sent,
      openRate:
        d.sent > 0 ? Number(((d.opened / d.sent) * 100).toFixed(1)) : 0,
    }));
  }, [campaigns]);

  // 🔹 Open rate per campagna (top/bottom)
  const campaignsWithRates = useMemo(() => {
    return campaigns.map((c) => {
      const sent = c.sent_count || c.total_recipients || 0;
      const opened = c.opened_count || 0;
      const clicked = c.clicked_count || 0;

      const openRate = sent > 0 ? (opened / sent) * 100 : 0;
      const ctr = sent > 0 ? (clicked / sent) * 100 : 0;

      return {
        id: c.id,
        name: c.campaign_name || c.subject || "Senza nome",
        status: c.status,
        sent,
        opened,
        openRate: Number(openRate.toFixed(1)),
        ctr: Number(ctr.toFixed(1)),
        date: c.sent_at || c.created_at,
      };
    });
  }, [campaigns]);

  const topCampaigns = useMemo(
    () =>
      [...campaignsWithRates]
        .filter((c) => c.sent > 0)
        .sort((a, b) => b.openRate - a.openRate)
        .slice(0, 5),
    [campaignsWithRates]
  );

  const worstCampaigns = useMemo(
    () =>
      [...campaignsWithRates]
        .filter((c) => c.sent > 0)
        .sort((a, b) => a.openRate - b.openRate)
        .slice(0, 5),
    [campaignsWithRates]
  );

  if (loading) {
    return (
      <div className="text-center py-10 text-gray-500">
        Caricamento dashboard…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      {/* ====== STATISTICHE PRINCIPALI ====== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Campagne Totali */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Mail className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Campagne Totali</p>
              <p className="text-2xl font-bold">{totalCampaigns}</p>
            </div>
          </div>
        </div>

        {/* Contatti attivi */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Users className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Contatti Attivi</p>
              <p className="text-2xl font-bold">{activeContacts}</p>
            </div>
          </div>
        </div>

        {/* Email inviate */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <Send className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Email Inviate</p>
              <p className="text-2xl font-bold">
                {totalEmailsSent.toLocaleString("it-IT")}
              </p>
            </div>
          </div>
        </div>

        {/* Open rate medio */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Tasso Apertura Medio</p>
              <p className="text-2xl font-bold">
                {avgOpenRate ? avgOpenRate.toFixed(1) + "%" : "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ====== ENGAGEMENT OVERVIEW + GRAFICO MENSILE ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement Overview */}
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Engagement Overview
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Open Rate Medio</p>
              <p className="text-xl font-bold text-gray-900">
                {avgOpenRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Click Rate Medio</p>
              <p className="text-xl font-bold text-gray-900">
                {avgClickRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Bounce Rate</p>
              <p className="text-xl font-bold text-gray-900">
                {bounceRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Tot. Click</p>
              <p className="text-xl font-bold text-gray-900">
                {totalClicked.toLocaleString("it-IT")}
              </p>
            </div>
          </div>
        </div>

        {/* Invii per mese */}
        <div className="bg-white p-6 rounded-lg shadow-sm border lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            Invii & Open Rate per mese
          </h3>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="invii"
                name="Invii"
                radius={[6, 6, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="openRate"
                name="Open Rate %"
                dot={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ====== INVII PER GIORNO DELLA SETTIMANA ====== */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          Invii & Open Rate per giorno della settimana
        </h3>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="invii" name="Invii" radius={[6, 6, 0, 0]} />
            <Line
              type="monotone"
              dataKey="openRate"
              name="Open Rate %"
              dot={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ====== CAMPAGNE RECENTI (TOP 4) ====== */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Campagne Recenti
          </h3>

          <button
            onClick={() => setActiveTab("campaigns-list")}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Vedi tutte →
          </button>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Campagna
              </th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Stato
              </th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Destinatari
              </th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Aperture
              </th>
              <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                Data
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {campaigns
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.sent_at || b.created_at) -
                  new Date(a.sent_at || a.created_at)
              )
              .slice(0, 4)
              .map((c) => {
                const date = c.sent_at || c.created_at;
                const formattedDate = date
                  ? new Date(date).toLocaleString("it-IT", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-";

                const sent = c.sent_count || c.total_recipients || 0;
                const opened = c.opened_count || 0;
                const openRate =
                  sent > 0
                    ? `${Math.round((opened / sent) * 100)}%`
                    : "-";

                return (
                  <tr key={c.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {c.campaign_name || c.subject || "Senza nome"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {c.subject}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          c.status === "sent"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {c.status === "sent" ? "Inviata" : "Bozza"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {sent}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {openRate}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formattedDate}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* ====== TOP / WORST CAMPAGNE ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Top 5 Campagne (per open rate)
            </h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">
                  Campagna
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">
                  Open Rate
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">
                  CTR
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topCampaigns.map((c) => (
                <tr key={c.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {c.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {c.openRate.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {c.ctr.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Peggiori 5 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              5 Campagne con performance più basse
            </h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">
                  Campagna
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">
                  Open Rate
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">
                  CTR
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {worstCampaigns.map((c) => (
                <tr key={c.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {c.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {c.openRate.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {c.ctr.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


  // ----------------------- MODALE MODIFICA CAMPAGNA -----------------------
  const EditCampaignModal = ({ 
    campaign, 
    contacts, 
    onClose, 
    onSave, 
    setActiveTab,
    onOpenBuilder // ✅ Aggiungi questa prop
  }) => {
    // 📋 Stati principali
    const [campaignName, setCampaignName] = useState(campaign.name || "");
    const [subject, setSubject] = useState(campaign.subject || "");
    const [emailContent, setEmailContent] = useState(campaign.content || "<p></p>");
   // ✅ Usa recipient_list invece di recipients
const [recipientList, setRecipientList] = useState(
  Array.isArray(campaign.recipient_list) 
    ? campaign.recipient_list 
    : (campaign.recipients || [])
);
    const [selectedAccount, setSelectedAccount] = useState(campaign.account || "");
    const [showLoadMessage, setShowLoadMessage] = useState(false);
    const [editorReady, setEditorReady] = useState(false);
    const [isBuilderTemplate, setIsBuilderTemplate] = useState(false);
const [editorKey, setEditorKey] = useState(0);
const [tiptapEditor, setTiptapEditor] = useState(null);
    // 🆕 Aggiungi l'hook per caricare gli account
  const { accounts, defaultAccount, loading: loadingAccounts } = useEmailAccounts();

    const [cc, setCc] = useState(campaign.cc || "");
  
    const [bcc, setBcc] = useState(campaign.bcc || "");

// 🔄 Sincronizza i dati della campagna quando cambia o quando si apre la modale
useEffect(() => {
  if (!campaign) return;

  setEditorReady(false);

  console.log('🔄 Caricamento campagna...', campaign);
  console.log('📧 Email content:', campaign.email_content);

  setCampaignName(campaign.campaign_name || "");
  setSubject(campaign.subject || "");
  setEmailContent(campaign.email_content || "<p></p>");
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

  // ✅ RILEVA AUTOMATICAMENTE SE È UN TEMPLATE DEL BUILDER
  const content = campaign.email_content || "";
  const hasBuilderMarkers = 
    content.includes('data-block-id') || 
    content.includes('builder-block') ||
    content.includes('mj-') || // Mjml blocks
    content.includes('style="max-width:600px"') || // Layout tipici email
    (content.length > 1000 && content.includes('<table')); // Template complessi
  
  // O verifica dal campo database se esiste
  const isBuilderFromDB = campaign.is_builder_template === true;
  
  const isBuilder = isBuilderFromDB || hasBuilderMarkers;
  setIsBuilderTemplate(isBuilder);
  
  console.log('🎨 Builder template detection:', {
    isBuilderFromDB,
    hasBuilderMarkers,
    finalDecision: isBuilder,
    contentLength: content.length
  });

  const recipients = Array.isArray(campaign.recipient_list) 
    ? campaign.recipient_list 
    : (campaign.recipients || []);
  setRecipientList(recipients);

  setTimeout(() => {
    console.log('🎨 Impostando contenuto editor:', campaign.email_content);
    setEmailContent(campaign.email_content || "<p></p>");
    setEditorReady(true);
  }, 150);

  setShowLoadMessage(true);
  const timer = setTimeout(() => setShowLoadMessage(false), 2000);
  return () => clearTimeout(timer);
}, [campaign]);
console.log('🎨 Rendering TiptapEditor with content:', emailContent.substring(0, 100));
// Nel render
{editorReady && (
  <TiptapEditor 
    content={emailContent} 
    onChange={setEmailContent}
    key={campaign.id} // ✅ Forza il re-render quando cambia campagna
  />
)}

// 📎 Allegati
const fileInputRef = useRef(null);
const [attachments, setAttachments] = useState(campaign.attachments || []);

  
    // 📎 Allegati
   
    const [previewImage, setPreviewImage] = useState(null);
    const [previewPdf, setPreviewPdf] = useState(null);
  
    // 🎞️ Hook per le animazioni di lightbox e PDF
    const { shouldRender: showImage, animationClass: imageAnim } = useAnimatedUnmount(!!previewImage);
    const { shouldRender: showPdf, animationClass: pdfAnim } = useAnimatedUnmount(!!previewPdf);
  
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
    useEffect(() => {
      console.log('🔍 Campaign loaded:', {
        recipient_list: campaign.recipient_list,
        recipients: campaign.recipients,
        recipientList_state: recipientList,
        email_content: campaign.email_content,
        content: campaign.content
      });
    }, [campaign, recipientList]);
    /* 🔍 Controlla modifiche */
    const hasChanges = useMemo(() => {
      return (
        campaignName !== (campaign.campaign_name || "") ||
        subject !== (campaign.subject || "") ||
        emailContent !== (campaign.email_content || "<p></p>") ||
        selectedAccount !== (campaign.sender_email || "") ||
        cc !== (campaign.cc || "") ||
        bcc !== (campaign.bcc || "") ||
        JSON.stringify(recipientList) !== JSON.stringify(campaign.recipient_list || [])
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
    
    try {
      // 🔍 Trova l'account selezionato per ottenere l'ID
      const selectedAccountData = accounts.find(acc => acc.email === selectedAccount);
      
      if (!selectedAccountData) {
        throw new Error("Account mittente non trovato");
      }

      const updatedCampaign = {
        id: campaign.id,
        campaignName: campaignName,
        subject: subject,
        emailContent: emailContent,
        recipientList: recipientList,
        senderEmail: selectedAccount,
        senderEmailId: selectedAccountData.id, // ✅ Aggiungi l'ID dell'account
        cc: cc,
        bcc: bcc,
        attachments: attachments,
        totalAttachmentSize: attachments.reduce(
          (sum, a) => sum + (a.file?.size || a.size || 0),
          0
        ),
      };

      console.log('📦 Dati da aggiornare:', updatedCampaign);

      const { success, data, error } = await saveCampaign(updatedCampaign, true);

      if (!success) {
        throw new Error(error);
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
      
      if (onSave) onSave(data);
      
      onClose();
    } catch (error) {
      console.error('❌ Errore aggiornamento campagna:', error);
      alert('❌ Errore nel salvataggio: ' + error.message);
    }
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
  
          {/* Form */}
          <div className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Nome Campagna</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
  
            {/* Account di invio - VERSIONE AGGIORNATA */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Account di invio
            </label>
            {loadingAccounts ? (
              <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-blue-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span className="text-gray-500 text-sm">Caricamento account...</span>
              </div>
            ) : accounts.length > 0 ? (
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Seleziona un account...</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.email}>
                    {acc.name} ({acc.email})
                    {acc.is_default && ' - Predefinito'}
                    {acc.verified && ' ✓'}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full p-3 border border-yellow-300 bg-yellow-50 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Nessun account email configurato. 
                  <button
                    onClick={() => {
                      // Naviga alla pagina settings o apri modal settings
                      // window.location.hash = '#settings';
                      onClose(); // ✅ Chiudi il modal
                      setActiveTab('settings'); // ✅ Vai a settings
                    }}
                    className="text-blue-600 hover:underline ml-1"
                  >
                    Configura ora
                  </button>
                </p>
              </div>
            )}
          </div>

  
            {/* CC / CCN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">CC</label>
                <input
                  type="text"
                  value={cc}
                  onChange={(e) => handleCcChange(e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 outline-none ${
                    ccError ? "border-red-500 focus:ring-red-300" : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder="es. mario@esempio.it, luca@azienda.com"
                />
                {ccError && <p className="text-red-600 text-sm mt-1">{ccError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">CCN</label>
                <input
                  type="text"
                  value={bcc}
                  onChange={(e) => handleBccChange(e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 outline-none ${
                    bccError ? "border-red-500 focus:ring-red-300" : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder="es. admin@azienda.it, support@azienda.com"
                />
                {bccError && <p className="text-red-600 text-sm mt-1">{bccError}</p>}
              </div>
            </div>
  
            {/* Oggetto */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Oggetto Email</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>


{/* Contenuto Email */}
<div>
  <label className="block text-sm font-medium mb-2 text-gray-700">Contenuto Email</label>
  
  {isBuilderTemplate ? (
    /* 🔥 SE È UN TEMPLATE DAL BUILDER, MOSTRA ANTEPRIMA + AZIONI */
    <div className="space-y-4">
      {/* Anteprima HTML */}
      <div
        className="border border-gray-200 rounded-lg bg-gray-50 prose max-w-none max-h-[400px] overflow-y-auto p-5 leading-relaxed text-gray-800 text-[15px] shadow-inner scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        dangerouslySetInnerHTML={{
          __html: emailContent || "<p class='text-gray-400 italic'>Nessun contenuto disponibile</p>"
        }}
      />

   {/* Pulsanti azione */}
<div className="flex gap-2">
<button
  onClick={() => {
    console.log('🎨 Click su Modifica nel Builder');
    
    // 1️⃣ Crea un blocco dal contenuto della campagna
    const templateBlock = {
      id: 'predefined-template',
      name: campaignName || 'Template da Modifica',
      icon: '📄',
      category: 'layout',
      html: emailContent,
      instanceId: `edit-${Date.now()}`
    };

    // 2️⃣ Salva in sessionStorage
    sessionStorage.setItem('builderBlocks', JSON.stringify([templateBlock]));
    sessionStorage.setItem('builderTemplate', emailContent);
    sessionStorage.setItem('currentEmailContent', emailContent);
    sessionStorage.setItem('isBuilderTemplate', 'true');
    
    // 3️⃣ Salva i dati della campagna
    sessionStorage.setItem('editingCampaignData', JSON.stringify({
      id: campaign.id,
      campaign_name: campaignName,
      subject: subject,
      sender_email: selectedAccount,
      cc: cc,
      bcc: bcc,
      recipient_list: recipientList,
      attachments: attachments
    }));
    sessionStorage.setItem('editingCampaignId', campaign.id);

    console.log('💾 Template salvato in sessionStorage');

    // 4️⃣ Chiudi questo modal
    onClose();

    // 5️⃣ ✅ Apri in modalità 'builder'
    if (onOpenBuilder) {
      onOpenBuilder('builder'); // ✅ PASSA 'builder' QUI
    }

    toast.success('📝 Apertura Template Builder...', { 
      duration: 1500,
      style: {
        background: '#3b82f6',
        color: '#fff',
      }
    });
  }}
  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
>
  <Edit3 className="w-4 h-4" />
  Modifica nel Builder
</button>
        
        <button
          onClick={() => {
            // 🔥 Pulisci tutto quando esci senza scegliere
            sessionStorage.removeItem('builderTemplate');
            sessionStorage.removeItem('builderBlocks');
            sessionStorage.removeItem('currentEmailContent');
            sessionStorage.removeItem('isBuilderTemplate');
            setEmailContent('<p></p>');
            setIsBuilderTemplate(false);
            setEditorKey(prev => prev + 1);
          }}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg transition"
        >
          🗑️ Rimuovi Template
        </button>
      </div>
      
      {/* Editor HTML raw opzionale */}
      <details className="border border-gray-200 rounded-lg">
        <summary className="cursor-pointer p-3 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700">
          📝 Modifica HTML (Avanzato)
        </summary>
        <textarea
          value={emailContent}
          onChange={(e) => setEmailContent(e.target.value)}
          className="w-full h-64 p-3 border-t border-gray-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </details>
    </div>
  ) : (
    /* 🔥 ALTRIMENTI USA TIPTAP EDITOR NORMALE */
    <TiptapEditor 
      key={editorKey}
      content={emailContent} 
      onChange={setEmailContent}
      onEditorReady={(editor) => setTiptapEditor(editor)}
    />
  )}
</div>
            {/* Editor */}
            {/* <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Contenuto Email</label>
              <TiptapEditor content={emailContent} onChange={setEmailContent} />
            </div> */}
  
            {/* Destinatari */}
            {/* <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Lista Destinatari</label>
              <Select
                isMulti
                options={[
                  {
                    value: "all",
                    label: `Tutti i contatti attivi (${contacts.filter((c) => c.status === "active").length})`,
                  },
                  { value: "premium", label: "Clienti premium" },
                  { value: "prospect", label: "Prospect" },
                ]}
                value={recipientList.map((v) => ({ value: v, label: v }))}
                onChange={(selected) =>
                  setRecipientList(selected ? selected.map((o) => o.value) : [])
                }
                className="w-full"
              />
            </div>
   */}

{/* Lista Destinatari */}
<RecipientSelect
  value={recipientList}
  onChange={setRecipientList}
  contacts={contacts}
/>
            {/* 📎 Allegati */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                Allegati
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  <Paperclip className="w-4 h-4" /> Aggiungi allegato
                </button>
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAddAttachments}
                multiple
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.zip,.txt"
              />
              {attachments.length > 0 ? (
                <>
                  <ul className="mt-2 space-y-2">
                    {attachments.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {item.preview ? (
                            <img
                              src={item.preview}
                              alt="preview"
                              onClick={() => setPreviewImage(item.preview)}
                              className="w-8 h-8 object-cover rounded cursor-pointer hover:scale-105 transition-transform"
                            />
                          ) : item.isPdf ? (
                            <button
                              onClick={() => setPreviewPdf(item.url)}
                              className="text-red-500 hover:text-red-700 flex items-center gap-1"
                            >
                              <FileText className="w-5 h-5" />
                              <span className="underline">PDF</span>
                            </button>
                          ) : (
                            <span className="text-lg">{getFileIcon(item.type, item.filename)}</span>
                          )}
                          <span className="truncate">{item.file?.name || item.filename}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.url && (
                            <a
                              href={item.url}
                              download={item.filename}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              <Download className="w-4 h-4" />
                              <span>Scarica</span>
                            </a>
                          )}
                          <button
                            onClick={() => handleRemoveAttachment(index)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-gray-500 text-right">
                    Totale allegati: <strong>{totalSize}</strong>
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500 italic">Nessun allegato aggiunto</p>
              )}
            </div>
          </div>
  
          {/* Pulsanti */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition"
            >
              Annulla
            </button>
            <button
              onClick={handleSaveClick}
              className={`flex-1 py-2 px-4 rounded-lg text-white transition ${
                ccError || bccError ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={!!ccError || !!bccError}
            >
              Salva Modifiche
            </button>
          </div>
        </div>

        {/* 📤 MODALE CONFERMA INVIO CAMPAGNA DRAFT */}
{showConfirmSendCampaign && campaignToSend && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
     {console.log('🔵 MODALE CAMPAGNA APERTO', campaignToSend)}
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
      <h3 className="text-xl font-bold mb-3 text-gray-800">
        📤 Invia Campagna
      </h3>
      
      <div className="mb-5 space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm font-semibold text-gray-800">
            {campaignToSend.campaign_name}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Oggetto: {campaignToSend.subject}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded p-2">
            <p className="text-xs text-gray-600">Destinatari</p>
            <p className="font-semibold text-gray-800">
              {campaignToSend.recipient_list?.length || 0}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded p-2">
            <p className="text-xs text-gray-600">Da</p>
            <p className="font-semibold text-gray-800 truncate">
              {campaignToSend.sender_email}
            </p>
          </div>
        </div>

        {campaignToSend.cc && campaignToSend.cc.length > 0 && (
          <p className="text-xs text-gray-600">
            CC: {campaignToSend.cc.join(", ")}
          </p>
        )}

        {campaignToSend.bcc && campaignToSend.bcc.length > 0 && (
          <p className="text-xs text-gray-600">
            BCC: {campaignToSend.bcc.join(", ")}
          </p>
        )}

        <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          ⚠️ L'email verrà inviata immediatamente e la campagna verrà contrassegnata come "Inviata".
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => {
            setShowConfirmSendCampaign(false);
            setCampaignToSend(null);
            setSendingId(null); // ✅ Reset anche qui
          }}
          disabled={sendingCampaign}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition disabled:opacity-50"
        >
          Annulla
        </button>
        <button
          onClick={confirmSendCampaign}
          disabled={sendingCampaign}
          className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {sendingCampaign ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Invio in corso...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Invia Ora
            </>
          )}
        </button>
      </div>
    </div>
  </div>
)}
  
        {/* 🖼️ Lightbox immagine */}
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
  
        {/* 📄 Lightbox PDF */}
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
  
        {/* ✅ Notifica */}
        {showSuccess && (
          <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg animate-fadeIn">
            ✅ Campagna aggiornata correttamente
          </div>
        )}
  
        {/* ⚠️ Conferme */}
        {showConfirmSave && (
          <ConfirmModal
            title="Salvare le modifiche?"
            message="Le modifiche verranno salvate definitivamente."
            confirmLabel="Salva"
            onConfirm={confirmSave}
            onCancel={() => setShowConfirmSave(false)}
          />
        )}
        {showConfirmExit && (
          <ConfirmModal
            title="Uscire senza salvare?"
            message="Le modifiche non salvate andranno perse."
            confirmLabel="Esci"
            danger
            onConfirm={confirmExit}
            onCancel={() => setShowConfirmExit(false)}
          />
        )}
        {/* ✅ Notifica caricamento campagna */}
        {showLoadMessage && (
          <div className="fixed top-6 right-6 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fadeZoomIn">
            🔄 Dati campagna caricati correttamente
          </div>
        )}

      </div>
    );
  };
// ----------------------- MODALE VISUALIZZA CAMPAGNA -----------------------
const ViewCampaignModal = ({
  campaign,
  onClose,
  setShowEditModal,
  setSelectedCampaign,
  onDuplicate,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [miniToast, setMiniToast] = useState(null); // ✅ mini notifica interna
  const { duplicateCampaign, deleteCampaign } = useCampaigns();

  if (!campaign) return null;

  const getFileIcon = (type, filename) => {
    if (type?.includes("pdf")) return "📕";
    if (type?.includes("zip") || filename?.endsWith(".zip")) return "🗜️";
    if (type?.includes("word")) return "📘";
    if (type?.includes("excel")) return "📗";
    if (type?.includes("text")) return "📄";
    if (type?.includes("image")) return "🖼️";
    return "📁";
  };

  const showMiniToast = (msg, type = "success") => {
    setMiniToast({ msg, type });
    setTimeout(() => setMiniToast(null), 2500);
  };

  const handleResend = async () => {
    try {
      setLoading(true);
      
      // 1️⃣ Duplica la campagna
      const { success, data, error } = await duplicateCampaign(campaign.id);
      if (!success) throw new Error(error);
      
      // 2️⃣ Apri il modal di invio con i dati precompilati
      setSelectedCampaign(data);
      setShowEmailModal(true); // ← Modal per selezionare destinatari e inviare
      onClose();
      
      toast.success("📨 Campagna pronta per il reinvio!");
      showMiniToast("Seleziona i destinatari");
      
    } catch (err) {
      toast.error("Errore nel duplicare la campagna");
      showMiniToast("Errore duplicazione", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const { success, error } = await deleteCampaign(campaign.id);
      if (!success) throw new Error(error);
      toast.success("🗑️ Campagna eliminata con successo!");
      showMiniToast("Campagna eliminata correttamente");
      setConfirmDelete(false);
      setTimeout(onClose, 800);
    } catch (err) {
      toast.error("Errore nell'eliminazione della campagna");
      showMiniToast("Errore eliminazione", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateCampaign = async (campaign) => {
    try {
      const recipients = Array.isArray(campaign.recipient_list)
        ? campaign.recipient_list
        : [];
  
      const payload = {
        campaignName: `${campaign.campaign_name || campaign.name} (Copia)`,
        subject: campaign.subject || "",
        emailContent: campaign.email_content || "<p></p>",
        recipientList: recipients,
        cc: campaign.cc || "",
        bcc: campaign.bcc || "",
        senderEmail: campaign.sender_email || "",
        attachments: campaign.attachments || [],
        totalAttachmentSize: campaign.total_attachment_size || 0,
        trackingEnabled: campaign.tracking_enabled !== false,
        openTracking: campaign.open_tracking !== false,
        clickTracking: campaign.click_tracking !== false,
      };
  
      const res = await saveCampaign(payload, true); // true = BOZZA
  
      if (!res.success) throw new Error(res.error);
  
      toast.success("📄 Campagna duplicata come bozza");
      loadCampaigns();
    } catch (err) {
      console.error(err);
      toast.error("❌ Errore durante la duplicazione");
    }
  };
  

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative p-8"
        >
          {/* HEADER */}
          <div className="flex items-center justify-between mb-6 border-b pb-3">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Mail className="w-6 h-6 text-blue-600" />
              Dettagli Campagna
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* OGGETTO E NOME */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Nome Campagna</label>
              <p className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                {campaign.campaign_name || campaign.name || "—"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Oggetto Email</label>
              <p className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                {campaign.subject || "—"}
              </p>
            </div>

            {!showAll && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAll(true)}
                  className="text-blue-600 text-sm font-medium hover:underline"
                >
                  Mostra tutti i dettagli ↓
                </button>
              </div>
            )}

            <AnimatePresence>
              {showAll && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  {/* Contenuto Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Contenuto Email
                    </label>
                    <div
                      className="border border-gray-200 rounded-lg bg-gray-50 prose max-h-[600px] overflow-y-auto p-5 leading-relaxed text-gray-800 text-[15px] shadow-inner scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                      dangerouslySetInnerHTML={{
                        __html:
                          campaign.email_content ||
                          campaign.content ||
                          "<p class='text-gray-400 italic'>Nessun contenuto disponibile</p>",
                      }}
                    />
                  </div>

                  {/* Destinatari */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Lista Destinatari
                    </label>
                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-gray-800 flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      {Array.isArray(campaign.recipient_list)
                        ? campaign.recipient_list.join(", ")
                        : "—"}
                    </div>
                  </div>

                  {/* Allegati */}
{campaign.attachments?.length > 0 && (
  <div className="mt-6">
    <label className="block text-sm font-semibold text-gray-600 mb-2">
      Allegati ({campaign.attachments.length})
    </label>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {campaign.attachments.map((file, idx) => {
        const isImage = file.type?.includes("image");
        const isPDF = file.type?.includes("pdf");
        const isDoc = file.type?.includes("word");
        const isZip = file.filename?.endsWith(".zip");
        const icon = isImage
          ? "🖼️"
          : isPDF
          ? "📕"
          : isDoc
          ? "📘"
          : isZip
          ? "🗜️"
          : "📎";

        return (
          <div
            key={idx}
            className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow transition cursor-pointer group"
          >
            <div className="flex items-center gap-3 truncate">
              <span className="text-xl">{icon}</span>
              <span className="truncate text-gray-800 group-hover:text-blue-600">
                {file.filename || "file_senza_nome"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {file.url && (
                <a
                href={
                  file.url?.endsWith(".pdf")
                    ? `https://docs.google.com/gview?url=${encodeURIComponent(file.url)}&embedded=true`
                    : file.url
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                Apri
              </a>
              )}
              {file.url && (
                <a
                  href={file.url}
                  download
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Scarica
                </a>
              )}
            </div>
          </div>
        );
      })}
                      </div>
                    </div>
                  )}

                  {/* Stato e Data */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Stato</label>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          campaign.status === "sent"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Data Creazione</label>
                      <p className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                        {new Date(campaign.created_at).toLocaleString("it-IT")}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => setShowAll(false)}
                      className="text-blue-600 text-sm font-medium hover:underline"
                    >
                      Mostra meno ↑
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

         {/* FOOTER */}
<div className="flex justify-end mt-8 gap-3">
  {campaign.status === "sent" && (
    <>
      {/* Pulsante REINVIA (invia subito) */}
      <button
        onClick={handleResend}
        disabled={loading}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-5 rounded-lg font-medium transition"
      >
        <Send className="w-4 h-4" />
        {loading ? "Invio..." : "Reinvia Email"}
      </button>
      
      {/* Pulsante DUPLICA (crea bozza) */}
      <button
        onClick={handleDuplicateCampaign}
        disabled={loading}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-5 rounded-lg font-medium transition"
      >
        <Copy className="w-4 h-4" />
        {loading ? "Duplicazione..." : "Duplica"}
      </button>
    </>
  )}
  
  <button
    onClick={() => setConfirmDelete(true)}
    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 px-5 rounded-lg font-medium transition"
  >
    <Trash2 className="w-4 h-4" />
    Elimina
  </button>
  
  <button
    onClick={onClose}
    className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-5 rounded-lg font-medium transition"
  >
    Chiudi
  </button>
</div>

          {/* ✅ Mini-toast interno */}
          <AnimatePresence>
            {miniToast && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
                className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-sm flex items-center gap-2 z-[10000] ${
                  miniToast.type === "success"
                    ? "bg-green-600 text-white"
                    : "bg-red-600 text-white"
                }`}
              >
                {miniToast.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                <span>{miniToast.msg}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ⚠️ Modale conferma eliminazione */}
        <AnimatePresence>
          {confirmDelete && (
            <motion.div
              key="delete-confirm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="bg-white rounded-lg p-6 max-w-sm w-full text-center shadow-xl"
              >
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  Eliminare definitivamente questa campagna?
                </h3>
                <p className="text-sm text-gray-600 mb-5">
                  L’azione non potrà essere annullata.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg"
                  >
                    {loading ? "Eliminazione..." : "Elimina"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

  // ----------------------- COMPONENTE CAMPAGNE (Supabase) -----------------------
const Campaigns = ({ setActiveTab }) => {
  const {
    campaigns,
    loading,
    loadCampaigns,
    deleteCampaign: deleteCampaignDB,
    saveCampaign,
    updateCampaignAfterSend,
    getCampaign,
  } = useCampaigns();

  
  useEffect(() => {
    console.log('🎯 CAMPAIGNS IN COMPONENT:', campaigns);
    if (campaigns.length > 0) {
      console.log('🎯 First campaign:', campaigns[0]);
      console.log('🎯 First campaign status:', campaigns[0]?.status);
      console.log('🎯 Status type:', typeof campaigns[0]?.status);
    }
  }, [campaigns]);
  const [isFromBuilder, setIsFromBuilder] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const [sortField, setSortField] = useState("sent_at");
const [sortDirection, setSortDirection] = useState("desc");
const [editingCampaignForBuilder, setEditingCampaignForBuilder] = useState(null);
// Aggiungi questo state per tracciare se stiamo modificando
const [shouldOpenBuilder, setShouldOpenBuilder] = useState(false);
const [editingCampaignData, setEditingCampaignData] = useState(null);
const [searchTerm, setSearchTerm] = useState("");
const [statusFilter, setStatusFilter] = useState("all");
const [dateFilter, setDateFilter] = useState("all");
const [sendingId, setSendingId] = useState(null); // id campagna in invio
const [openMenuId, setOpenMenuId] = useState(null); // menu ⋯ aperto
const [skipModeSelection, setSkipModeSelection] = useState(false);
const [selected, setSelected] = useState([]); // id delle selezionate
const handleSort = (field) => {
  if (sortField === field) {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  } else {
    setSortField(field);
    setSortDirection("asc");
  }
};

const [showSendingProgress, setShowSendingProgress] = useState(false);
const [sendingProgress, setSendingProgress] = useState({
  current: 0,
  total: 0,
  status: 'preparing', // 'preparing', 'sending', 'completed', 'error'
  message: 'Preparazione invio...'
});

const toggleSelect = (id) => {
  setSelected((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  );
};

const toggleSelectAll = (pageItems) => {
  const ids = pageItems.map((c) => c.id);

  const allSelected = ids.every((id) => selected.includes(id));

  if (allSelected) {
    setSelected((prev) => prev.filter((id) => !ids.includes(id)));
  } else {
    setSelected((prev) => [...new Set([...prev, ...ids])]);
  }
};


  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignMode, setCampaignMode] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRecipientsModal, setShowRecipientsModal] = useState(false);
const [recipientsCampaign, setRecipientsCampaign] = useState(null);
const [recipients, setRecipients] = useState([]);
  // const [showCampaignModal, setShowCampaignModal] = useState(false);

  // Invio e Re-invio
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [showResendConfirm, setShowResendConfirm] = useState(false);
  const [campaignToResend, setCampaignToResend] = useState(null);

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState("idle");
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientCategory, setRecipientCategory] = useState("all");
  
  

  // Toast generico
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  

  // 🔄 carica dal DB
  useEffect(() => {
    loadCampaigns();
  }, []);

  // ↔️ Helpers di mapping (DB → UI fallback ai vecchi campi locali se esistessero)
  const getName = (c) => c.campaign_name ?? c.name ?? "Senza nome";
  const getRecipientsArray = (c) => Array.isArray(c.recipient_list) ? c.recipient_list : (c.recipients || []);
  const getOpened = (c) => c.opened_count ?? c.opened ?? 0;
  const getClicked = (c) => c.clicked_count ?? c.clicked ?? 0;
  const menuRef = useRef(null);
  // ✏️ Aggiorna campagna (solo UI: l’EditCampaignModal chiamerà onSave che deve poi fare update su DB se lo usi così)
  const handleUpdate = () => {
    // Se mantieni un EditCampaignModal che salva su local/localStorage, valuta di spostare la logica su supabase.
    // Qui rimane lo stub solo per non toccare il tuo flusso UI.
    loadCampaigns();
  };

  // 💾 callback dal modal “Nuova Campagna” quando salvi bozza
  const handleSaveDraft = () => {
    setToastMessage("💾 Bozza salvata correttamente");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
    loadCampaigns();
  };
  // Aggiungi questo useEffect
  useEffect(() => {
    if (shouldOpenBuilder && campaignMode === 'builder') {
      console.log('✅ Opening modal with builder mode');
      setShowCampaignModal(true);
      setShouldOpenBuilder(false);
    }
  }, [shouldOpenBuilder, campaignMode]);
  
  
  // 📤 Invia campagna esistente (trasformi una bozza in inviata)
  const handleSendCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setShowSendConfirm(true);
  };
  useEffect(() => {
    console.log('🟣 State changed:', { 
      showEditModal, 
      selectedCampaignId: selectedCampaign?.id || 'null',
      showCampaignModal,
      campaignMode 
    });
  }, [showEditModal, selectedCampaign, showCampaignModal, campaignMode]);

  // ✅ Conferma invio: marca la campagna corrente come “sent”
const confirmSend = async () => {
  setSending(true); // Invece di setIsSending
  setShowConfirmSend(false);

  try {
    console.log('🚀 confirmSend - Inizio invio');
    console.log('📧 selectedAccount:', selectedAccount);
    console.log('📋 recipientList:', recipientList);
    console.log('📝 subject:', subject);
    console.log('📄 emailContent length:', emailContent?.length);
    console.log('🎯 selectedCampaign:', selectedCampaign); // ✅ DEBUG

    // ✅ Validazioni
    if (!selectedAccount) {
      toast.error("⚠️ Seleziona un account di invio");
      setSending(false); // Invece di setIsSending
      return;
    }

    if (!recipientList || recipientList.length === 0) {
      toast.error("⚠️ Aggiungi almeno un destinatario");
      setSending(false); // Invece di setIsSending
      return;
    }

    if (!subject) {
      toast.error("⚠️ Inserisci l'oggetto dell'email");
      setSending(false); // Invece di setIsSending
      return;
    }

    if (!emailContent) {
      toast.error("⚠️ Il contenuto dell'email è vuoto");
      setSending(false); // Invece di setIsSending
      return;
    }

    // Trova l'oggetto account completo
    const accountObj = accounts.find(acc => acc.email === selectedAccount);
    
    if (!accountObj) {
      toast.error("⚠️ Account non trovato");
      setSending(false); // Invece di setIsSending
      return;
    }

    console.log('✅ Account trovato:', accountObj);

    let successCount = 0;
    let failedCount = 0;
    let failedRecipients = [];

    // ✅ INVIO SMTP
    if (accountObj.provider === "brevo" || accountObj.smtp) {
      console.log('📤 Invio via SMTP...');

      const payload = {
        user_id: user.id,
        from: accountObj.email,
        to: recipientList,
        cc: cc ? cc.split(",").map((e) => e.trim()).filter(Boolean) : [],
        bcc: bcc ? bcc.split(",").map((e) => e.trim()).filter(Boolean) : [],
        subject,
        html: emailContent,
        attachments: attachmentsData,
        smtp: accountObj.smtp,
      };

      console.log('📦 Payload SMTP:', payload);

      const response = await fetch("/api/send-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('📥 Risultato SMTP:', result);

      if (!result.success) {
        throw new Error(result.message || "Errore durante l'invio");
      }

      successCount = result.sent;
      failedCount = result.failed || 0;
      failedRecipients = result.errors?.map(e => e.email) || [];
    }

    // ✅ INVIO RESEND
    if (accountObj.provider === "resend") {
      console.log('📤 Invio via Resend...');

      const payload = {
        apiKey: resendApiKey,
        user_id: user.id,
        from: accountObj.email,
        to: recipientList,
        cc: cc ? cc.split(",").map((e) => e.trim()).filter(Boolean) : [],
        bcc: bcc ? bcc.split(",").map((e) => e.trim()).filter(Boolean) : [],
        subject,
        html: emailContent,
        attachments: attachmentsData,
      };

      const response = await fetch("/api/resend/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Errore durante l'invio");
      }

      successCount = result.sent || recipientList.length;
    }

    // ✅ AGGIORNA LO STATUS DELLA CAMPAGNA SE È UNA BOZZA
    if (selectedCampaign?.id && selectedCampaign.status === "draft") {
      console.log('🔄 Aggiornamento status campagna da draft a sent...');
      
      const { error: updateError } = await supabase
        .from("campaigns")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          sent_count: successCount,
          failed_count: failedCount,
        })
        .eq("id", selectedCampaign.id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("⚠️ Errore aggiornamento campagna:", updateError);
      } else {
        console.log("✅ Campagna aggiornata a 'sent'");
        
        // ✅ Ricarica le campagne per aggiornare la UI
        await loadCampaigns();
      }
    }

    // ✅ FEEDBACK SUCCESSO
    setProgress(100);
    setSentCount(successCount);
    setFailedCount(failedCount);

    toast.success(
      `✅ Email inviata con successo a ${successCount} destinatari!`,
      { duration: 3000 }
    );

    // Reset stati
    setTimeout(() => {
      setProgress(0);
      setSentCount(0);
      setFailedCount(0);
      setSelectedCampaign(null); // ✅ Reset campagna selezionata
    }, 3000);

  } catch (error) {
    console.error("💥 Errore invio:", error);
    toast.error(`❌ Errore: ${error.message}`);
  } finally {
    setSending(false);
  }
};
  useEffect(() => {
    const handleKey = (e) => {
      if (!selectedCampaign) return;
  
      if (e.key === "v") setShowViewModal(true);
      if (e.key === "e") setShowEditModal(true);
  
      if (e.key === "s" && selectedCampaign.status === "draft") {
        handleSendCampaign(selectedCampaign);
      }
  
      if (e.key === "r" && selectedCampaign.status === "sent") {
        handleResendCampaign(selectedCampaign);
      }
  
      if (e.key === "Delete") {
        setShowDeleteConfirm(true);
      }
    };
  
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedCampaign]);
  
  // ----------------------- RE-INVIO (duplica e segna sent) -----------------------
  const handleResendCampaign = (campaign) => {
    setCampaignToResend(campaign);
    setShowResendConfirm(true);
  };

  const confirmResend = async () => {
    if (!campaignToResend) return;

    // ✅ CHIUDI MODALE CONFERMA E APRI MODALE PROGRESSO
  setShowResendConfirm(false);
  setShowSendingProgress(true);
  setSendingProgress({
    current: 0,
    total: 0,
    status: 'preparing',
    message: 'Preparazione re-invio...'
  });
  
    try {
      console.log('═══════════════════════════════════');
    console.log('🚀 INIZIO RE-INVIO');
    console.log('═══════════════════════════════════');
    console.log('📦 campaignToResend COMPLETO:', campaignToResend);
    console.log('📋 recipient_list:', campaignToResend.recipient_list);
    console.log('📋 Type:', typeof campaignToResend.recipient_list);
    console.log('📋 Is Array:', Array.isArray(campaignToResend.recipient_list));


     // ✅ CARICA DESTINATARI
     setSendingProgress(prev => ({
      ...prev,
      message: 'Caricamento destinatari...'
    }));

  
      // 1) Ricavo destinatari
      // const recipientsRaw = getRecipientsArray(campaignToResend);
      let recipientsRaw = campaignToResend.recipient_list;
      console.log('📧 recipient_list dal DB:', recipientsRaw);
      console.log('📧 Type:', typeof recipientsRaw)

    // ✅ PRENDI DIRETTAMENTE recipient_list
    let recipients = [];
    
    console.log('📧 recipient_list dal DB:', recipientsRaw);
    console.log('📧 Type:', typeof recipientsRaw);
      
      // ✅ VALIDA E PULISCI I DESTINATARI
     
    
      // ✅ GESTISCI IL CASO "all"
    if (Array.isArray(recipientsRaw) && recipientsRaw.length === 1 && recipientsRaw[0] === 'all') {
      console.log('📋 Destinatari = "all", carico tutti i contatti...');

      setSendingProgress(prev => ({
        ...prev,
        message: 'Caricamento contatti dalla rubrica...'
      }));
      
      
      // Carica tutti i contatti dal database
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('email')
        .eq('user_id', user.id);

      if (contactsError) {
        throw new Error('Errore caricamento contatti: ' + contactsError.message);
      }

      if (!contactsData || contactsData.length === 0) {
        throw new Error('Nessun contatto trovato nel database');
      }

      recipients = contactsData
        .map(c => c.email)
        .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
      
      console.log('✅ Caricati', recipients.length, 'contatti dalla rubrica');
    } 
    // ✅ ALTRIMENTI VALIDA LE EMAIL NORMALI
    else if (Array.isArray(recipientsRaw)) {
      recipients = recipientsRaw
        .filter(email => typeof email === 'string' && email.trim() && email !== 'all')
        .map(email => email.trim())
        .filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    } else if (typeof recipientsRaw === 'string') {
      try {
        const parsed = JSON.parse(recipientsRaw);
        if (Array.isArray(parsed)) {
          recipients = parsed
            .filter(email => typeof email === 'string' && email.trim() && email !== 'all')
            .map(email => email.trim())
            .filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
        }
      } catch {
        recipients = recipientsRaw
          .split(/[,;\n]/)
          .map(e => e.trim())
          .filter(e => e !== 'all' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
      }
    }
    
    console.log('✅ Recipients finali:', recipients);
    console.log('✅ Totale:', recipients.length);
    
    if (recipients.length === 0) {
      throw new Error("Nessun destinatario valido trovato");
    }

    // ✅ AGGIORNA TOTALE DESTINATARI
    setSendingProgress({
      current: 0,
      total: recipients.length,
      status: 'sending',
      message: `Invio a ${recipients.length} destinatari...`
    });

    const attachments = Array.isArray(campaignToResend.attachments) ? campaignToResend.attachments : [];

     // ✅ CARICA ACCOUNT
     setSendingProgress(prev => ({
      ...prev,
      message: 'Verifica account mittente...'
    }));

    // ✅ CARICA L'ACCOUNT
    const senderEmail = campaignToResend.sender_email || localStorage.getItem("resend_sender_email") || "";
    
    const { data: accountsData, error: accountsError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('email', senderEmail)
      .single();

    if (accountsError || !accountsData) {
      throw new Error("Account mittente non trovato");
    }
    
    const accountObj = accountsData;
    console.log('✅ Account trovato:', accountObj.email);

    let successCount = 0;
    let failedCount = 0;

  
      // ✅ 3) SMTP/Brevo
      if (accountObj.provider === "brevo" || accountObj.smtp) {
        console.log('📤 Invio via SMTP a:', recipients.length, 'destinatari');
        
        const payload = {
          user_id: user.id,
          from: accountObj.email,
          to: recipients, // ✅ Array pulito
          cc: Array.isArray(campaignToResend.cc) ? campaignToResend.cc : [],
          bcc: Array.isArray(campaignToResend.bcc) ? campaignToResend.bcc : [],
          subject: campaignToResend.subject || "",
          html: campaignToResend.email_content || campaignToResend.content || "<p></p>",
          attachments: attachments,
          smtp: accountObj.smtp,
        };
  
        console.log('📦 Payload SMTP:', {
          ...payload,
          html: '[HTML content]',
          to: payload.to.slice(0, 3) + (payload.to.length > 3 ? '...' : '')
        });
  
        const response = await fetch("/api/send-campaign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
  
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.message || "Errore invio SMTP");
        }
  
        successCount = result.sent;
        failedCount = result.failed || 0;

        // ✅ AGGIORNA PROGRESSO
      setSendingProgress({
        current: successCount,
        total: recipients.length,
        status: 'sending',
        message: `Inviate ${successCount}/${recipients.length} email...`
      });
      }
  
      // ✅ 4) Resend
      if (accountObj.provider === "resend") {
        console.log('📤 Invio via Resend a:', recipients.length, 'destinatari');
        setSendingProgress(prev => ({
          ...prev,
          message: 'Invio via Resend in corso...'
        }));
        
        const resendApiKey = process.env.NEXT_PUBLIC_RESEND_API_KEY;
  
        if (!resendApiKey) {
          throw new Error("API key Resend mancante");
        }
        
        const payload = {
          apiKey: resendApiKey,
          user_id: user.id,
          from: accountObj.email,
          to: recipients, // ✅ Array pulito
          cc: Array.isArray(campaignToResend.cc) ? campaignToResend.cc : [],
          bcc: Array.isArray(campaignToResend.bcc) ? campaignToResend.bcc : [],
          subject: campaignToResend.subject || "",
          html: campaignToResend.email_content || campaignToResend.content || "<p></p>",
          attachments: attachments,
        };
  
        console.log('📦 Payload Resend:', {
          ...payload,
          resendApiKey: '[HIDDEN]',
          html: '[HTML content]',
          to: payload.to.slice(0, 3) + (payload.to.length > 3 ? '...' : '')
        });
  
        const response = await fetch("/api/resend/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
  
        const result = await response.json();
        
        console.log('📥 Risposta Resend:', result);
        
        if (!result.success) {
          throw new Error(result.message || "Errore invio Resend");
        }
  
        successCount = result.sent || recipients.length;
        // ✅ AGGIORNA PROGRESSO
      setSendingProgress({
        current: successCount,
        total: recipients.length,
        status: 'sending',
        message: `Inviate ${successCount}/${recipients.length} email...`
      });
      }
  
      console.log(`✅ Email inviate: ${successCount}, fallite: ${failedCount}`);
   // ✅ COMPLETATO
   setSendingProgress({
    current: successCount,
    total: recipients.length,
    status: 'completed',
    message: `✅ ${successCount} email inviate con successo!`
  });
      // ✅ 5) Salva duplicato
      const payload = {
        campaignName: `${getName(campaignToResend)} (Re-invio)`,
        subject: campaignToResend.subject || "",
        emailContent: campaignToResend.email_content || campaignToResend.content || "<p></p>",
        recipientList: recipients,
        cc: campaignToResend.cc || "",
        bcc: campaignToResend.bcc || "",
        senderEmail: senderEmail,
        attachments: attachments,
        totalAttachmentSize: campaignToResend.total_attachment_size || 0,
      };
  
      const saveRes = await saveCampaign(payload, false);
      
      if (saveRes.success && saveRes.data?.id) {
        await updateCampaignAfterSend(saveRes.data.id, {
          sentCount: successCount,
          failedCount: failedCount,
          totalRecipients: recipients.length,
        });
      }
  
      await loadCampaigns();
  
      // ✅ CHIUDI MODALE DOPO 2 SECONDI
    setTimeout(() => {
      setShowSendingProgress(false);
      toast.success(`✅ Campagna reinviata a ${successCount} destinatari!`, { duration: 3000 });
    }, 2000);
  
    } catch (err) {
      console.error("💥 Errore re-invio:", err);
      // ✅ MOSTRA ERRORE NEL MODALE
      setSendingProgress({
        current: 0,
        total: 0,
        status: 'error',
        message: `❌ ${err.message}`
      });
      
      // Chiudi dopo 3 secondi
      setTimeout(() => {
        setShowSendingProgress(false);
      }, 3000);
    } finally {
      setShowResendConfirm(false);
    }
  };

  const handleBulkDelete = () => {
    if (selected.length === 0) return;
    selected.forEach(id => handleDeleteCampaign(id));
    setSelected([]);
  };
  
  const handleBulkSend = () => {
    const drafts = campaigns.filter(c => selected.includes(c.id) && c.status === "draft");
    drafts.forEach(c => handleSendCampaign(c));
    setSelected([]);
  };
  
  const handleBulkDuplicate = async () => {
    const items = campaigns.filter(c => selected.includes(c.id));
  
    for (const c of items) {
      await duplicateCampaign(c); // devi avere già questa funzione
    }
    setSelected([]);
  };
  
  // ----------------------- ELIMINA -----------------------
  const handleDeleteCampaign = async (campaignId) => {
    try {
      setDeleteStatus("deleting");
      const { success, error } = await deleteCampaignDB(campaignId);
      if (success) {
        setDeleteStatus("success");
        setShowDeleteToast(true);
        await loadCampaigns();
        setTimeout(() => {
          setShowDeleteToast(false);
          setShowDeleteConfirm(false);
          setDeleteStatus("idle");
        }, 1200);
      } else {
        setDeleteStatus("idle");
        setToastMessage("❌ Errore eliminazione: " + (error || "operazione fallita"));
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      console.error(err);
      setDeleteStatus("idle");
      setToastMessage("❌ Errore imprevisto durante l’eliminazione");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
  
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // 📅 formato data
  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  let filtered = campaigns;

  // 🔍 ricerca live
  if (searchTerm) {
    filtered = filtered.filter((c) =>
      (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.subject || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  // 📌 filtro stato
  if (statusFilter !== "all") {
    filtered = filtered.filter((c) => c.status === statusFilter);
  }
  
  // 📅 filtro data
  const now = new Date();
  
  if (dateFilter === "7") {
    filtered = filtered.filter((c) => new Date(c.sent_at || c.created_at) >= new Date(now - 7 * 864e5));
  }
  if (dateFilter === "30") {
    filtered = filtered.filter((c) => new Date(c.sent_at || c.created_at) >= new Date(now - 30 * 864e5));
  }
  if (dateFilter === "365") {
    filtered = filtered.filter((c) => new Date(c.sent_at || c.created_at) >= new Date(now - 365 * 864e5));
  }
  const loadRecipients = async (campaignId) => {
    const { data, error } = await supabase
      .from("campaign_recipients")
      .select(`
        id,
        email,
        name,
        status,
        opened,
        clicked,
        opened_at,
        clicked_at,
        contacts (
          tags
        )
      `)
      .eq("campaign_id", campaignId)
      .order("email");
  
    if (error) throw error;
    return data;
  };
  
  const getRecipientsCount = (campaign, contacts) => {
    // 🟢 Caso ALL
    if (
      campaign.recipient_list === "all" ||
      (Array.isArray(campaign.recipient_list) &&
        campaign.recipient_list.includes("all"))
    ) {
      return contacts.length;
    }
  
    // 🟢 Caso numero già salvato correttamente
    if (typeof campaign.total_recipients === "number") {
      return campaign.total_recipients;
    }
  
    // 🟡 Fallback: lista esplicita
    if (Array.isArray(campaign.recipient_list)) {
      return campaign.recipient_list.filter(Boolean).length;
    }
  
    return 0;
  };
  const recipientsCount = getRecipientsCount(campaigns, contacts);
  // 🔽 ordinamento
  filtered = filtered.sort((a, b) => {
    const x = a[sortField] || "";
    const y = b[sortField] || "";
  
    if (sortDirection === "asc") return x > y ? 1 : -1;
    return x < y ? 1 : -1;
  });
  
  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
  <h2 className="text-2xl font-bold text-gray-900">Campagne</h2>

  <div className="flex items-center gap-2">
    {/* 🔄 Switch vista */}
    <button
      onClick={() => setViewMode("grid")}
      className={`px-3 py-1 rounded border ${
        viewMode === "grid"
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-gray-700 border-gray-300"
      }`}
    >
      🔳 Griglia
    </button>

    <button
      onClick={() => setViewMode("list")}
      className={`px-3 py-1 rounded border ${
        viewMode === "list"
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-gray-700 border-gray-300"
      }`}
    >
      📋 Lista
    </button>

    {/* 🆕 Nuova campagna */}
    <button
      onClick={() => {
        setSelectedCampaign(null);
        setShowCampaignModal(true);
        setCampaignMode(null);
      }}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
    >
      <Plus className="w-4 h-4" />
      Nuova Campagna
    </button>
     {/* 🖨️ Stampa lista campagne */}
  <button
    onClick={() => {
      // Apri una nuova finestra per stampare
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      // Crea il contenuto HTML della tabella
      const tableHtml = `
        <html>
          <head>
            <title>Lista Campagne</title>
            <style>
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #333; padding: 8px; text-align: left; }
              th { background-color: #f0f0f0; }
            </style>
          </head>
          <body>
            <h1>Lista Campagne</h1>
            <table>
              <thead>
                <tr>
                  <th>Soggetto</th>
                  <th>Data Invio</th>
                  <th>Destinatari</th>
                  <th>Aperte</th>
                  <th>Stato</th>
                </tr>
              </thead>
              <tbody>
                ${campaigns
                  .map(
                    (c) => `
                  <tr>
                    <td>${c.subject || "-"}</td>
                    <td>${c.sentAt || "-"}</td>
                    <td>${c.recipients?.length || 0}</td>
                    <td>${c.opened || 0}</td>
                    <td>${c.status || "-"}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </body>
        </html>
      `;

      // Scrivi il contenuto nella nuova finestra e apri la stampa
      printWindow.document.write(tableHtml);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }}
    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
  >
    🖨️ Stampa Campagne
  </button>
</div>

</div>


      {/* 🧾 Lista Campagne */}
{/* ======================= */}
{/*   VISTA A GRIGLIA       */}
{/* ======================= */}
{viewMode === "grid" && (
  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
    {loading ? (
      <p className="text-gray-500">Caricamento campagne…</p>
    ) : campaigns.length > 0 ? (
      campaigns.map((campaign) => (
        <div key={campaign.id} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{getName(campaign)}</h3>
                  <p className="text-sm text-gray-600">{campaign.subject}</p>
                  {/* opzionale: sent_at/scheduled */}
                  {campaign.sent_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Inviata il {formatDate(campaign.sent_at)}
                    </p>
                  )}
                </div>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    campaign.status === "sent"
                      ? "bg-green-100 text-green-800"
                      : campaign.status === "scheduled"
                      ? "bg-indigo-100 text-indigo-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {campaign.status === "sent"
                    ? "Inviata"
                    : campaign.status === "scheduled"
                    ? "Programm."
                    : "Bozza"}
                </span>
              </div>

              <div className="space-y-2 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Destinatari:</span>
                  

                  <button
  onClick={async () => {
    setRecipientsCampaign(campaign);
    setShowRecipientsModal(true);

    const { data } = await supabase
      .from("campaign_recipients")
      .select("email, name, status, sent_at, opened_at")
      .eq("campaign_id", campaign.id)
      .order("sent_at", { ascending: false });

    setRecipients(data || []);
  }}
  className="font-medium text-blue-600 hover:text-blue-800 underline"
>
  {campaign.total_recipients}
</button>



                </div>
                {campaign.status === "sent" && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Aperture:</span>
                      <span className="font-medium">{getOpened(campaign)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Click:</span>
                      <span className="font-medium">{getClicked(campaign)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* 🔘 Pulsanti */}
           
             <div className="px-6 py-4"> {/* ✅ Cambiato da <td> a <div> */}
  <div className="flex justify-end items-center gap-2 relative">

    {/* VEDI */}
    <button
      disabled={sendingId === campaign.id}
      onClick={() => {
        setSelectedCampaign(campaign);
        setShowViewModal(true);
      }}
      className="btn-action btn-blue"
    >
      <Eye className="w-4 h-4" />
      Vedi
    </button>

    {/* MODIFICA */}
    <button
      disabled={sendingId === campaign.id}
      onClick={() => {
        setSelectedCampaign(campaign);
        setShowEditModal(true);
      }}
      className="btn-action btn-gray"
    >
      <Edit3 className="w-4 h-4" />
      Modifica
    </button>

    {/* INVIA / RE-INVIA */}
    {campaign.status === "draft" && (
  <button
    disabled={sendingId === campaign.id}
    onClick={() => {
      console.log('🎯 Click su Invia - Campaign:', campaign);
      setSendingId(campaign.id);
      handleSendCampaign(campaign); // ✅ NON impostare sendingId qui
    }}
    className="btn-action btn-green"
  >
    {sendingId === campaign.id ? (
      <Loader2 className="w-4 h-4 animate-spin" />
    ) : (
      <>
        <Send className="w-4 h-4" />
        Invia
      </>
    )}
  </button>
)}

    {campaign.status === "sent" && (
      <button
        disabled={sendingId === campaign.id}
        onClick={async () => {
          setSendingId(campaign.id);
          await handleResendCampaign(campaign);
          setSendingId(null);
        }}
        className="btn-action btn-indigo"
      >
        {sendingId === campaign.id ? (
  <Loader2 className="w-4 h-4 animate-spin" />
) : (
  <>
    <Send className="w-4 h-4 rotate-180" />
    Re-invia
  </>
)}
      </button>
    )}

    {/* ⋯ ALTRE AZIONI */}
    <button
      onClick={() =>
        setOpenMenuId(openMenuId === campaign.id ? null : campaign.id)
      }
      className="btn-action btn-light px-2"
    >
      <MoreVertical className="w-4 h-4" />
    </button>

    {/* MENU DROPDOWN */}
    {openMenuId === campaign.id && (
      <div className="absolute right-0 top-10 z-50 w-44 bg-white border rounded-lg shadow-lg overflow-hidden">
        <button
          onClick={() => {
            setSelectedCampaign(campaign);
            setShowViewModal(true);
            setOpenMenuId(null);
          }}
          className="menu-item"
        >
          👁️ Vedi (V)
        </button>

        <button
          onClick={() => {
            setSelectedCampaign(campaign);
            setShowEditModal(true);
            setOpenMenuId(null);
          }}
          className="menu-item"
        >
          ✏️ Modifica (E)
        </button>

        <button
          onClick={() => {
            handleResendCampaign(campaign);
            setOpenMenuId(null);
          }}
          className="menu-item"
        >
          🔁 Duplica
        </button>

        <button
          onClick={() => {
            setSelectedCampaign(campaign);
            setShowDeleteConfirm(true);
            setOpenMenuId(null);
          }}
          className="menu-item text-red-600"
        >
          🗑️ Elimina (DEL)
        </button>
      </div>
    )}
  </div>
  </div> {/* ✅ Chiuso con </div> invece di </td> */}




            </div>
          ))
        ) : (
          <p className="text-gray-500 italic">Nessuna campagna disponibile.</p>
        )}
      </div>
)}
{/* ======================= */}
{/*   VISTA A LISTA / TABELLA */}
{/* ======================= */}
{viewMode === "list" && (
  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">

    {/* 🔍 FILTRI E RICERCA */}
    <div className="p-4 flex flex-wrap items-center gap-3 border-b bg-gray-50">
      {/* Ricerca */}
      <input
        type="text"
        placeholder="Cerca campagne…"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border rounded-lg px-3 py-1.5 w-60"
      />

      {/* Filtro stato */}
      <select
        className="border rounded-lg px-3 py-1.5"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="all">Tutte</option>
        <option value="sent">Inviate</option>
        <option value="draft">Bozze</option>
        <option value="scheduled">Programmate</option>
      </select>

      {/* Filtro data */}
      <select
        className="border rounded-lg px-3 py-1.5"
        value={dateFilter}
        onChange={(e) => setDateFilter(e.target.value)}
      >
        <option value="all">Qualsiasi data</option>
        <option value="7">Ultimi 7 giorni</option>
        <option value="30">Ultimi 30 giorni</option>
        <option value="365">Ultimi 12 mesi</option>
      </select>

      {/* Contatore selezionati */}
      {selected.length > 0 && (
        <span className="ml-auto font-medium text-blue-600">
          {selected.length} selezionate
        </span>
      )}
    </div>

    {/* 🧨 Azioni di massa */}
    {selected.length > 0 && (
      <div className="p-3 bg-blue-50 border-b flex gap-3">
        <button onClick={handleBulkSend} className="px-3 py-1 bg-green-600 text-white rounded text-sm">
          Invia selezionate
        </button>

        <button onClick={handleBulkDuplicate} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">
          Duplica
        </button>

        <button onClick={handleBulkDelete} className="px-3 py-1 bg-red-600 text-white rounded text-sm">
          Elimina
        </button>
      </div>
    )}

    {/* ====================== */}
    {/*   TABELLA COMPLETA     */}
    {/* ====================== */}
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3">
            <input
              type="checkbox"
              onChange={() => toggleSelectAll(filtered)}
              checked={filtered.length > 0 && filtered.every((c) => selected.includes(c.id))}
            />
          </th>

          {/* HEADER con ordinamento */}
          {[
            { key: "campaign_name", label: "Campagna" },
            { key: "status", label: "Stato" },
            { key: "total_recipients", label: "Destinatari" },
            { key: "opened_count", label: "Aperture" },
            { key: "sent_at", label: "Data" },
          ].map((col) => (
            <th
              key={col.key}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
              onClick={() => handleSort(col.key)}
            >
              {col.label}
              {sortField === col.key && (sortDirection === "asc" ? " ↑" : " ↓")}
            </th>
          ))}

          <th className="px-6 py-3"></th>
        </tr>
      </thead>

      <tbody className="bg-white divide-y divide-gray-200">
        {filtered.map((campaigns) => {
          const date = campaigns.sent_at || campaigns.created_at;
          const formatted = date ? new Date(date).toLocaleString("it-IT") : "-";

          return (
            <tr key={campaigns.id}>
              <td className="px-6 py-4">
                <input
                  type="checkbox"
                  checked={selected.includes(campaigns.id)}
                  onChange={() => toggleSelect(campaigns.id)}
                />
              </td>

              <td className="px-6 py-4 font-medium">{campaigns.campaign_name}</td>

              <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs rounded-full ${
                    campaigns.status === "sent"
                      ? "bg-green-100 text-green-800"
                      : campaigns.status === "draft"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-indigo-100 text-indigo-800"
                  }`}
                >
                  {campaigns.status}
                </span>
              </td>

              <td className="px-6 py-4">{campaigns.total_recipients}</td>

              <td className="px-6 py-4">{campaigns.opened_count || 0}</td>

              <td className="px-6 py-4 text-gray-500">{formatted}</td>

              <td className="px-6 py-4 space-x-2 text-right">
  {/* 👁️ VEDI */}

  <div className="flex justify-end items-center gap-2 text-sm">

    <button
      onClick={() => {
        setSelectedCampaign(campaigns);
        setShowViewModal(true);
      }}
      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
    >
      <Eye className="w-4 h-4" /> Vedi
    </button>

    <button
      onClick={() => {
        setSelectedCampaign(campaigns);
        setShowEditModal(true);
      }}
      className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
    >
      <Edit3 className="w-4 h-4" /> Modifica
    </button>

    {campaigns.status === "draft" && (
      <button
        onClick={() => handleSendCampaign(campaigns)}
        className="inline-flex items-center gap-1 text-green-600 hover:text-green-800"
      >
        <Send className="w-4 h-4" /> Invia
      </button>
    )}

    {campaigns.status === "sent" && (
      <button
        onClick={() => handleResendCampaign(campaigns)}
        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
      >
        <Send className="w-4 h-4 rotate-180" /> Re-invia
      </button>
    )}

    <button
      onClick={() => {
        setSelectedCampaign(campaigns);
        setShowDeleteConfirm(true);
      }}
      className="inline-flex items-center gap-1 text-red-600 hover:text-red-800"
    >
      <Trash2 className="w-4 h-4" /> Elimina
    </button>

  </div>
</td>

            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
)}

{/* 📊 MODALE PROGRESSO INVIO */}
{showSendingProgress && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[9999]">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
    >
      {sendingProgress.status === 'completed' ? (
        // ✅ SUCCESSO
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center"
          >
            <CheckCircle className="w-12 h-12 text-green-600" />
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Invio Completato!
          </h3>
          <p className="text-gray-600 mb-4">{sendingProgress.message}</p>
          <div className="text-sm text-gray-500">
            {sendingProgress.current} / {sendingProgress.total} email inviate
          </div>
        </div>
      ) : sendingProgress.status === 'error' ? (
        // ❌ ERRORE
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Errore Invio
          </h3>
          <p className="text-red-600">{sendingProgress.message}</p>
        </div>
      ) : (
        // 📤 IN CORSO
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {sendingProgress.status === 'preparing' ? 'Preparazione...' : 'Invio in corso...'}
          </h3>
          <p className="text-gray-600 mb-6">{sendingProgress.message}</p>
          
          {sendingProgress.total > 0 && (
            <>
              <div className="mb-2 text-sm font-medium text-gray-700">
                {sendingProgress.current} / {sendingProgress.total} email
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${(sendingProgress.current / sendingProgress.total) * 100}%` 
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </>
          )}
        </div>
      )}
    </motion.div>
  </div>
)}
      {/* 🗑️ Conferma elimina */}
      {showDeleteConfirm && selectedCampaign && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDeleteConfirm(false);
          }}
        >
          <div
            className={`bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full text-center transform transition-all duration-300
            ${showDeleteConfirm ? "animate-fadeZoomIn" : "animate-fadeZoomOut"}`}
          >
            {deleteStatus === "deleting" ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
                <p className="text-gray-600">Eliminazione in corso...</p>
              </div>
            ) : deleteStatus === "success" ? (
              <div className="flex flex-col items-center space-y-3">
                <div className="bg-green-100 text-green-600 p-3 rounded-full animate-pulseOnce">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-600 font-medium animate-fadeZoomIn">
                  Campagna eliminata con successo
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-center mb-3">
                  <div className="bg-red-100 text-red-600 p-3 rounded-full animate-pulseOnce">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-2 text-gray-800">Eliminare la campagna?</h3>
                <p className="text-sm text-gray-600 mb-5">
                  Questa azione è <b>irreversibile</b>. La campagna{" "}
                  <span className="font-medium text-gray-900">
                    “{selectedCampaign.campaign_name || selectedCampaign.name}”
                  </span>{" "}
                  verrà rimossa definitivamente.
                </p>

                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={() => handleDeleteCampaign(selectedCampaign.id)}
                    className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg shadow transition-transform hover:scale-105"
                  >
                    Elimina
                  </button>
                </div>
              </>
            )}
          </div>

          {showDeleteToast && (
            <div className="absolute bottom-10 right-10 bg-green-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg animate-fadeZoomIn">
              ✅ Campagna eliminata con successo
            </div>
          )}
        </div>
      )}
{showRecipientsModal && recipientsCampaign && (
  <div
    className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center"
    onClick={(e) => {
      if (e.target === e.currentTarget) setShowRecipientsModal(false);
    }}
  >
    <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl p-6 animate-fadeZoomIn">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Destinatari – {recipientsCampaign.campaign_name || recipientsCampaign.name}
        </h3>

        <button
          onClick={() => setShowRecipientsModal(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* 🔍 FILTRI */}
<div className="flex flex-wrap gap-3 mb-4">
  {/* Ricerca */}
  <input
    type="text"
    placeholder="Cerca nome o email..."
    value={recipientSearch}
    onChange={(e) => setRecipientSearch(e.target.value)}
    className="border rounded-lg px-3 py-2 text-sm w-64 focus:ring-2 focus:ring-blue-500"
  />

  {/* Categoria */}
  <select
    value={recipientCategory}
    onChange={(e) => setRecipientCategory(e.target.value)}
    className="border rounded-lg px-3 py-2 text-sm"
  >
    <option value="all">Tutte le categorie</option>
    {[...new Set(contacts.map(c => c.category).filter(Boolean))].map(cat => (
      <option key={cat} value={cat}>{cat}</option>
    ))}
  </select>
</div>

      {/* LISTA */}
      <div className="border rounded-lg overflow-hidden max-h-[420px] overflow-y-auto">
      
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">
                Nome
              </th>
              <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">
                Email
              </th>
              <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">
                Categoria
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {(() => {
            const recipientList = getRecipientsArray(recipientsCampaign);

            // ===============================
            // 🧠 COSTRUZIONE LISTA BASE
            // ===============================
            let list = [];
            
            // 👉 CASO: inviato a TUTTI ("all")
            if (
              Array.isArray(recipientList) &&
              recipientList.length === 1 &&
              recipientList[0] === "all"
            ) {
              list = contacts;
            } 
            // 👉 CASO: lista email specifiche
            else if (Array.isArray(recipientList) && recipientList.length > 0) {
              list = contacts.filter(c =>
                recipientList.includes(c.email)
              );
            }
            
            // ===============================
            // 🔍 RICERCA LIVE
            // ===============================
            if (recipientSearch) {
              const q = recipientSearch.toLowerCase();
              list = list.filter(c =>
                (c.name || "").toLowerCase().includes(q) ||
                (c.email || "").toLowerCase().includes(q)
              );
            }
            
            // ===============================
            // 🏷️ FILTRO CATEGORIA
            // ===============================
            if (recipientCategory !== "all") {
              list = list.filter(c => c.category === recipientCategory);
            }
            
            // ===============================
            // ⛔ EMPTY STATE
            // ===============================
            if (list.length === 0) {
              return (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-gray-500 italic"
                  >
                    Nessun destinatario trovato
                  </td>
                </tr>
              );
            }
            
              return list.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {c.name || "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {c.email}
                  </td>
                  <td className="px-4 py-2">
                    {c.category ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                        {c.category}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => setShowRecipientsModal(false)}
          className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
        >
          Chiudi
        </button>
      </div>
    </div>
  </div>
)}

   {/* ✏️ Modifica */}
{showEditModal && selectedCampaign && (
  <div style={{ position: 'fixed', zIndex: 9999 }}> {/* ✅ z-index altissimo */}
  <EditCampaignModal
    campaign={selectedCampaign}
    contacts={contacts}
    onClose={() => {
      console.log('🔴 Closing EditCampaignModal');
      setShowEditModal(false);
      setSelectedCampaign(null);
      setIsFromBuilder(false); // ✅ Reset del flag
      // ✅ Chiudi anche CampaignModal se ancora aperto
      setShowCampaignModal(false);
      setCampaignMode(null);
      setEditingCampaignData(null);
      setEditingCampaignForBuilder(null);
    }}
    onSave={handleUpdate}
    setActiveTab={setActiveTab}
    // ✅ CAMBIA IL DEFAULT DA 'normal' A 'builder'
    onOpenBuilder={(mode = 'builder') => {
      console.log('🎨 Opening builder for editing with mode:', mode);
    console.log('📋 selectedCampaign:', selectedCampaign);
    console.log('📧 email_content:', selectedCampaign.email_content);
      // ✅ Salva la campagna che stiamo modificando
      setEditingCampaignForBuilder(selectedCampaign);
      // Prepara i dati
      setEditingCampaignData({
        id: selectedCampaign.id,
        campaign_name: selectedCampaign.campaign_name,
        subject: selectedCampaign.subject,
        sender_email: selectedCampaign.sender_email,
        cc: selectedCampaign.cc,
        bcc: selectedCampaign.bcc,
        recipient_list: selectedCampaign.recipient_list,
        attachments: selectedCampaign.attachments,
        email_content: selectedCampaign.email_content
      });

      // ✅ AGGIUNGI QUESTO - Salva in sessionStorage
  sessionStorage.setItem('editingCampaignId', selectedCampaign.id);
  sessionStorage.setItem('builderTemplate', selectedCampaign.email_content);
  sessionStorage.setItem('isBuilderTemplate', 'true');
  console.log('💾 Salvato in sessionStorage:');
  console.log('  - editingCampaignId:', sessionStorage.getItem('editingCampaignId'));
  console.log('  - builderTemplate:', sessionStorage.getItem('builderTemplate'));
  console.log('  - isBuilderTemplate:', sessionStorage.getItem('isBuilderTemplate'));
      
     // Chiudi modal di modifica
  setShowEditModal(false);
  setSelectedCampaign(null); // Puoi anche lasciarlo
  
  // Usa il mode ricevuto come parametro
  setCampaignMode(mode);
  setShowCampaignModal(true);
  
  console.log('✅ Campaign modal opening with mode:', mode);
    }}
  />
  </div>
)}

{/* 👁️ Visualizza */}
{showViewModal && selectedCampaign && (
  <ViewCampaignModal
    campaign={selectedCampaign}
    onClose={() => setShowViewModal(false)}
    onDuplicate={handleDuplicateCampaign}
  />
)}

{/* 🆕 CAMPAGNA MODAL - UNA SOLA VOLTA */}
{!showEditModal && ( /* ✅ Mostra solo se EditModal non è aperto */
<CampaignModal
  showCampaignModal={showCampaignModal}
  setShowCampaignModal={setShowCampaignModal}
  campaignMode={campaignMode}
  setCampaignMode={setCampaignMode}
  contacts={contacts}
  onSaveDraft={() => {}}
  setActiveTab={setActiveTab}
  // ✅ Passa i dati della campagna in modifica
  editingCampaign={editingCampaignData}
  onCloseBuilder={() => {
    const editingId = sessionStorage.getItem('editingCampaignId');
    
    console.log('🔍 onCloseBuilder chiamato');
    console.log('  - editingId:', editingId);
    console.log('  - editingCampaignForBuilder:', editingCampaignForBuilder);
    console.log('  - campaigns array:', campaigns);
    
    if (editingId) {
      console.log('✅ Trovato editingId, cercando campagna...');
      
      let campaignToEdit = editingCampaignForBuilder || campaigns.find(c => c.id === editingId);
      
      console.log('📌 Campagna da modificare:', campaignToEdit);
      
      if (campaignToEdit) {
        console.log('✅ Riaprendo EditCampaignModal con campagna:', campaignToEdit);
         // ✅ Imposta il flag di protezione
      setIsFromBuilder(true);
        // ✅ PRIMO: Apri EditModal SUBITO (non in setTimeout!)
        setSelectedCampaign(campaignToEdit);
        setShowEditModal(true);
        console.log('✅ EditModal aperto immediatamente');
        
 // ✅ SECONDO: Chiudi CampaignModal DOPO con un ritardo
      // ⚠️ NON resettare setSelectedCampaign qui!
      // setTimeout(() => {
      //   console.log('🔒 Chiudendo CampaignModal ora');
      //   setShowCampaignModal(false);
      //   setCampaignMode(null);
      //   setEditingCampaignData(null);
      //   setEditingCampaignForBuilder(null);
      //   // ❌ NON fare: setSelectedCampaign(null);
      // }, 500);
        
        // ✅ Pulisci sessionStorage
        sessionStorage.removeItem('editingCampaignId');
        sessionStorage.removeItem('editingCampaignData');
        sessionStorage.removeItem('builderTemplate');
        sessionStorage.removeItem('builderBlocks');
        sessionStorage.removeItem('currentEmailContent');
        sessionStorage.removeItem('isBuilderTemplate');
        
      } else {
        console.error('❌ Campagna non trovata con ID:', editingId);
        toast.error('Errore: campagna non trovata');
        
        setShowCampaignModal(false);
        setCampaignMode(null);
        setEditingCampaignData(null);
        setEditingCampaignForBuilder(null);
        
        sessionStorage.removeItem('editingCampaignId');
        sessionStorage.removeItem('editingCampaignData');
      }
    } else {
      console.log('❌ Nessun editingId, chiudo semplicemente');
      
      setShowCampaignModal(false);
      setCampaignMode(null);
      setEditingCampaignData(null);
      setEditingCampaignForBuilder(null);
    }
  }}
/>
)}

      {/* ✅ Conferma Invio (marca “sent” la campagna corrente) */}
      {showSendConfirm && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Inviare la campagna “{getName(selectedCampaign)}”?
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              L’email verrà inviata ai destinatari selezionati.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowSendConfirm(false)}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
              >
                Annulla
              </button>
              <button
                onClick={confirmSend}
                className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                Invia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔁 Conferma Re-invio (duplica + sent) */}
      {showResendConfirm && campaignToResend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center border-t-4 border-indigo-600">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Reinviare la campagna “{getName(campaignToResend)}”?
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              Sei sicuro di voler reinviare questa campagna a tutti i destinatari?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowResendConfirm(false)}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
              >
                Annulla
              </button>
              <button
                onClick={confirmResend}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
              >
                Re-invia ora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔔 Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg w-[280px] animate-fadeIn z-[9999] overflow-hidden">
          <div className="flex items-center gap-2">
            <span>{toastMessage}</span>
          </div>
          <div className="absolute bottom-0 left-0 h-[3px] bg-white/50 animate-toastProgress"></div>
        </div>
      )}
    </div>
  );
};

  
 // --------------------- MODALE MODIFICA CONTATTO ---------------------
 // --------------------- MODALE MODIFICA CONTATTO ---------------------
const EditContactModal = ({ 
  show, 
  contact, 
  onClose, 
  onSave, 
  tags,
  sectors, 
  channels, 
  roles, 
  onOpenSectorsModal, 
  onOpenChannelsModal, 
  onOpenRolesModal 
}) => {

   // 🔥 AGGIUNGI QUESTI LOG
   console.log('🟡 EditContactModal riceve:');
   console.log('🟡 show:', show);
   console.log('🟡 contact:', contact);
   console.log('🟡 onOpenSectorsModal:', onOpenSectorsModal);
   console.log('🟡 onOpenChannelsModal:', onOpenChannelsModal);
   console.log('🟡 onOpenRolesModal:', onOpenRolesModal);
  // 🔥 UNICO STATE NECESSARIO
  const [editingContact, setEditingContact] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  // 🔥 Salva in sessionStorage quando editingContact cambia
  useEffect(() => {
    if (editingContact && typeof window !== 'undefined') {
      sessionStorage.setItem('editingContact_temp', JSON.stringify(editingContact));
    }
  }, [editingContact]);

  // 🔥 Carica i dati del contatto CON recupero da sessionStorage
  useEffect(() => {
    if (contact) {
      const savedEditing = sessionStorage.getItem('editingContact_temp');
      
      if (savedEditing) {
        const parsed = JSON.parse(savedEditing);
        // Se l'ID coincide, usa i dati salvati (che includono le selezioni)
        if (parsed.id === contact.id) {
          console.log('📂 Recuperato da sessionStorage:', parsed);
          setEditingContact(parsed);
          return;
        }
      }
      
      // Altrimenti usa contact fresco
      setEditingContact({
        ...contact,
        tags: contact.tags || []
      });
    }
  }, [contact]);

  // 🔥 Pulisci sessionStorage quando chiudi
  const handleClose = () => {
    sessionStorage.removeItem('editingContact_temp');
    console.log('🗑️ Pulito sessionStorage');
    onClose();
  };


  // 🔹 Carica i dati del contatto
  useEffect(() => {
    console.log('🔷 useEffect contact triggered');
  console.log('🔷 contact ricevuto:', contact);
  console.log('🔷 editingContact attuale:', editingContact);
  if (contact) {
    // 🔥 Controlla sessionStorage PRIMA di sovrascrivere
    const savedEditing = sessionStorage.getItem('editingContact_temp');
    
    if (savedEditing) {
      const parsed = JSON.parse(savedEditing);
      // Se l'ID coincide, mantieni i dati salvati
      if (parsed.id === contact.id) {
        console.log('📂 Mantengo editingContact da sessionStorage');
        setEditingContact(parsed);
        return; // 🔥 NON sovrascrivere con contact
      }
    }
    
    // Solo se non c'è nulla salvato, usa contact
    console.log('🆕 Nuovo editingContact da contact');
    setEditingContact({
      ...contact,
      tags: contact.tags || []
    });
  }
}, [contact]);

// E salva quando editingContact cambia
useEffect(() => {
  if (editingContact && typeof window !== 'undefined') {
    sessionStorage.setItem('editingContact_temp', JSON.stringify(editingContact));
    console.log('💾 Salvato in sessionStorage:', editingContact.sector_id, editingContact.channel_id, editingContact.contact_role_id);
  }
}, [editingContact]);

// Log quando sectors cambia
useEffect(() => {
  console.log('🟦 Sectors aggiornati:', sectors?.length, 'settori');
  console.log('🟦 editingContact.sector_id:', editingContact?.sector_id);
}, [sectors]);

// Log quando channels cambia
useEffect(() => {
  console.log('🟩 Channels aggiornati:', channels?.length, 'canali');
  console.log('🟩 editingContact.channel_id:', editingContact?.channel_id);
}, [channels]);

// Log quando roles cambia
useEffect(() => {
  console.log('🟧 Roles aggiornati:', roles?.length, 'ruoli');
  console.log('🟧 editingContact.contact_role_id:', editingContact?.contact_role_id);
}, [roles]);

  // Early return
  if (!show || !editingContact) return null;

  // Salvataggio
  const handleSave = () => {
    if (!editingContact.name || !editingContact.email) {
      toast.error("⚠️ Nome ed email sono obbligatori");
      return;
    }

    onSave(editingContact);
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 2000);
  };

  // Tag options per Select
  const tagOptions = (tags || []).map(tag => ({
    value: tag.value,
    label: tag.label
  }));

  const selectedTags = editingContact.tags 
    ? editingContact.tags.map(t => ({
        value: t,
        label: (tags || []).find(tag => tag.value === t)?.label || t
      }))
    : [];

  return (
    <>
      {/* Modale principale */}
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-slideUp">
          
          {/* HEADER */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Edit2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Modifica Contatto</h3>
                  <p className="text-sm text-gray-600">Aggiorna le informazioni del contatto</p>
                </div>
              </div>
              <button 
  onClick={(e) => {
    e.stopPropagation();
    setShowCancelConfirm(true);  // 🔥 Mostra conferma invece di chiudere direttamente
  }} 
  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition"
>
  <X className="w-6 h-6" />
</button>
            </div>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingContact.name || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Es. Mario Rossi"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={editingContact.email || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="mario.rossi@email.com"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={editingContact.status || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, status: e.target.value })}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white font-medium ${editingContact.status === 'active'
                      ? 'text-green-700'
                      : editingContact.status === 'inactive'
                        ? 'text-red-700'
                        : 'text-gray-700'
                    }`}
                >
                  <option value="" className="text-gray-700">Seleziona status</option>
                  <option value="active" className="text-green-700">✓ Attivo</option>
                  <option value="inactive" className="text-red-700">✗ Disattivo</option>
                </select>
              </div>

              {/* Attivo */}
              {/* <div className="flex items-center pt-8">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingContact.is_active || false}
                    onChange={(e) => setEditingContact({ ...editingContact, is_active: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Contatto attivo</span>
                </label>
              </div> */}

              {/* Tags */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tag</label>
                <Select
                  isMulti
                  options={tagOptions}
                  value={selectedTags}
                  onChange={(newValue) => {
                    const newTags = newValue ? newValue.map(t => t.value) : [];
                    setEditingContact({ ...editingContact, tags: newTags });
                  }}
                  placeholder="Seleziona uno o più tag..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>

              {/* SETTORE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Settore</label>
                <div className="flex gap-2">
                  <select
                    value={editingContact.sector_id || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, sector_id: e.target.value })}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none truncate"
                    style={{ minWidth: 0 }}  // 🔥 Importante per flex-1
                  >
                    <option value="">Seleziona settore</option>
                    {(sectors || []).map(sector => (
                      <option key={sector.id} value={sector.id} className="truncate">
                        {sector.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={onOpenSectorsModal}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex-shrink-0"
                    title="Gestisci Settori"
                  >
                    <Briefcase className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* CANALE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Canale</label>
                <div className="flex gap-2">
                  <select
                    value={editingContact.channel_id || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, channel_id: e.target.value })}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none truncate"
                    style={{ minWidth: 0 }}
                  >
                    <option value="">Seleziona canale</option>
                    {(channels || []).map(channel => (
                      <option key={channel.id} value={channel.id} className="truncate">
                        {channel.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={onOpenChannelsModal}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition flex-shrink-0"
                    title="Gestisci Canali"
                  >
                    <Radio className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* RUOLO */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ruolo</label>
                <div className="flex gap-2">
                  <select
                    value={editingContact.contact_role_id || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, contact_role_id: e.target.value })}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none truncate"
                    style={{ minWidth: 0 }}
                  >
                    <option value="">Seleziona ruolo</option>
                    {(roles || []).map(role => (
                      <option key={role.id} value={role.id} className="truncate">
                        {role.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={onOpenRolesModal}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition flex-shrink-0"
                    title="Gestisci Ruoli"
                  >
                    <UserCog className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tipologia/Periodicità/Copertura */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipologia Canale</label>
                <input
                  type="text"
                  value={editingContact.tipologia_canale || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, tipologia_canale: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Periodicità Canale</label>
                <input
                  type="text"
                  value={editingContact.periodicita_canale || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, periodicita_canale: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Copertura Canale</label>
                <input
                  type="text"
                  value={editingContact.copertura_canale || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, copertura_canale: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex gap-3 justify-end">
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Salva Modifiche
            </button>
             {/* Modale conferma */}
      <CancelConfirmModal
        show={showCancelConfirm}
        onCancel={() => setShowCancelConfirm(false)}
        onConfirm={() => {
          setShowCancelConfirm(false);
          handleClose();
        }}
      />
          </div>
        </div>
      </div>

      {/* Popup conferma */}
      {showSuccess && (
        <SuccessModal
          show={showSuccess}
          type="success"
          message="✅ Contatto aggiornato con successo!"
          duration={2000}
          onClose={() => setShowSuccess(false)}
        />
      )}
    </>
  );
};
const AddSectorModal = ({ show, onClose, onAdd }) => {
  const [sectorName, setSectorName] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);  // 🔥 Aggiungi questo state

  const handleAdd = () => {
    if (!sectorName) {
      alert("⚠️ Settore non può essere vuoto");
      return;
    }
    onAdd(sectorName); // Passa il nuovo settore al componente principale
    setSectorName(""); // Reset campo
    onClose(); // Chiudi il modale
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 shadow-lg">
        <h3 className="text-xl font-bold mb-6">Aggiungi Settore</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome Settore</label>
            <input
              type="text"
              value={sectorName}
              onChange={(e) => setSectorName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              placeholder="Es. Marketing"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setShowCancelConfirm(true)}  // 🔥 Mostra conferma
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Aggiungi Settore
          </button>
           {/* 🔥 Modale Conferma Annullamento */}
      <CancelConfirmModal
        show={showCancelConfirm}
        onCancel={() => setShowCancelConfirm(false)}
        onConfirm={() => {
          setShowCancelConfirm(false);
          setSectorName("");  // Reset campo
          onClose();
        }}
        title="Annulla Aggiunta Settore"
        message="Sei sicuro di voler annullare? Il settore inserito non verrà salvato."
      />
        </div>
      </div>
    </div>
  );
};
const AddChannelModal = ({ show, onClose, onAdd }) => {
  const [channelName, setChannelName] = useState("");

  const handleAdd = () => {
    if (!channelName) {
      alert("⚠️ Canale non può essere vuoto");
      return;
    }
    onAdd(channelName); // Passa il nuovo canale al componente principale
    setChannelName(""); // Reset campo
    onClose(); // Chiudi il modale
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 shadow-lg">
        <h3 className="text-xl font-bold mb-6">Aggiungi Canale</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome Canale</label>
            <input
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              placeholder="Es. Email"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Aggiungi Canale
          </button>
        </div>
      </div>
    </div>
  );
};
const AddRoleModal = ({ show, onClose, onAdd }) => {
  const [roleName, setRoleName] = useState("");

  const handleAdd = () => {
    if (!roleName) {
      alert("⚠️ Ruolo non può essere vuoto");
      return;
    }
    onAdd(roleName); // Passa il nuovo ruolo al componente principale
    setRoleName(""); // Reset campo
    onClose(); // Chiudi il modale
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 shadow-lg">
        <h3 className="text-xl font-bold mb-6">Aggiungi Ruolo</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome Ruolo</label>
            <input
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              placeholder="Es. Manager"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Aggiungi Ruolo
          </button>
        </div>
      </div>
    </div>
  );
};
const DeleteItemModal = ({ show, item, onClose, onDelete, itemType }) => {
  if (!show || !item) return null;

  const handleDelete = () => {
    onDelete(item.id); // Esegui eliminazione
    onClose(); // Chiudi il modale
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Elimina {itemType}</h3>
        <p className="text-gray-600 mb-6">
          Sei sicuro di voler eliminare <strong>{item.name}</strong>?
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Elimina
          </button>
        </div>
      </div>
    </div>
  );
};


// ---------------- COMPONENTE CONTATTI ----------------
const Contacts = () => {
  const { user } = useAuth(); // 👈 importa dal contesto auth
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user?.id) return;
    const loadContacts = async () => {
      try {
        const res = await fetch(`/api/contacts/get?user_id=${user.id}`);
        const result = await res.json();
        if (result.success) setContacts(result.data);
      } catch (err) {
        console.error("Errore caricamento contatti:", err);
      } finally {
        setLoading(false);
      }
    };
    loadContacts();
  }, [user?.id]);

  <Toaster position="top-right" />

const [showImportModal, setShowImportModal] = useState(false);
const [showAddModal, setShowAddModal] = useState(false);

const [showDeleteModal, setShowDeleteModal] = useState(false);


const [searchTerm, setSearchTerm] = useState("");
const [statusFilter, setStatusFilter] = useState({ value: "all", label: "Tutti" });
const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

const [currentPage, setCurrentPage] = useState(1);
const contactsPerPage = 6;

const [showEditModal, setShowEditModal] = useState(() => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('showEditModal') === 'true';
  }
  return false;
});

const [selectedContact, setSelectedContact] = useState(() => {
  if (typeof window !== 'undefined') {
    const saved = sessionStorage.getItem('selectedContact');
    return saved ? JSON.parse(saved) : null;
  }
  return null;
});

// Salva gli stati in sessionStorage quando cambiano
useEffect(() => {
  sessionStorage.setItem('showEditModal', showEditModal);
  if (selectedContact) {
    sessionStorage.setItem('selectedContact', JSON.stringify(selectedContact));
  } else {
    sessionStorage.removeItem('selectedContact');
  }
}, [showEditModal, selectedContact]);

// 🔄 Gestione cambio stato contatto
const handleToggleStatus = (id) => {
  const contact = contacts.find((c) => c.id === id);
  if (!contact) return;

  if (contact.status === "active") {
    // Se è attivo → chiede conferma per disiscrivere
    setContactToDeactivate(contact);
    setShowDeactivateConfirm(true);
  } else {
    // Se è disiscritto → riattiva subito
    setContacts((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: "active" } : c
      )
    );
    toast.success("✅ Contatto riattivato correttamente!");
  }
};

// ✅ Conferma disiscrizione
const confirmDeactivate = () => {
  if (!contactToDeactivate) return;

  setContacts((prev) =>
    prev.map((c) =>
      c.id === contactToDeactivate.id ? { ...c, status: "inactive" } : c
    )
  );

  toast("🚫 Contatto disiscritto correttamente!");
  cancelDeactivate(); // chiude modale
};

// ❌ Annulla disiscrizione (chiude il modale)
const cancelDeactivate = () => {
  setShowDeactivateConfirm(false);
  setContactToDeactivate(null);
};

// ➕ Aggiunta contatto
const handleAddContact = (newContact) => {
  setContacts((prev) => [...prev, newContact]);
};

// ✏️ Modifica contatto
const handleEditContact = (updatedContact) => {
  setContacts((prev) =>
    prev.map((c) => (c.id === updatedContact.id ? updatedContact : c))
  );
  toast.success("✅ Contatto modificato con successo!");
};

// 🗑️ Eliminazione contatto
const handleConfirmDelete = (id) => {
  setContacts((prev) => prev.filter((c) => c.id !== id));
  toast.success("🗑️ Contatto eliminato definitivamente!");
  setSelectedContact(null);
  setShowDeleteModal(false);
};

// ❌ Annulla eliminazione
const handleCancelDelete = () => {
  setSelectedContact(null);
  setShowDeleteModal(false);
};

// 📦 Import CSV
const handleImportContacts = (imported) => {
  setContacts((prev) => [...prev, ...imported]);
  toast.success("📥 Contatti importati correttamente!");
};

// 🔍 Filtraggio ricerca + stato
const filteredContacts = contacts.filter((c) => {
  const term = searchTerm.toLowerCase();
  const matchesSearch =
    c.name.toLowerCase().includes(term) ||
    c.email.toLowerCase().includes(term) ||
    c.tags.some((tag) => tag.toLowerCase().includes(term));

  const matchesStatus =
    statusFilter.value === "all" ||
    (statusFilter.value === "active" && c.status === "active") ||
    (statusFilter.value === "inactive" && c.status === "inactive");

  return matchesSearch && matchesStatus;
});

// ↕️ Ordinamento
const sortedContacts = [...filteredContacts].sort((a, b) => {
  if (!sortConfig.key) return 0;
  let A = a[sortConfig.key];
  let B = b[sortConfig.key];
  if (Array.isArray(A)) A = A.join(",");
  if (Array.isArray(B)) B = B.join(",");
  A = A.toLowerCase();
  B = B.toLowerCase();
  if (A < B) return sortConfig.direction === "asc" ? -1 : 1;
  if (A > B) return sortConfig.direction === "asc" ? 1 : -1;
  return 0;
});

// 📑 Paginazione
const totalContacts = sortedContacts.length;
const totalPages = Math.ceil(totalContacts / contactsPerPage);
const startIndex = (currentPage - 1) * contactsPerPage;
const endIndex = startIndex + contactsPerPage;
const currentContacts = sortedContacts.slice(startIndex, endIndex);

const handlePageChange = (page) => {
  if (page >= 1 && page <= totalPages) setCurrentPage(page);
};

// 🔽 Icone di ordinamento
const requestSort = (key) => {
  let direction = "asc";
  if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
  else if (sortConfig.key === key && sortConfig.direction === "desc") direction = null;
  setSortConfig({ key: direction ? key : null, direction });
};



const SortIcon = ({ column }) => {
  if (sortConfig.key !== column)
    return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 inline ml-1" />;
  return sortConfig.direction === "asc" ? (
    <ArrowUp className="w-3.5 h-3.5 text-blue-500 inline ml-1" />
  ) : (
    <ArrowDown className="w-3.5 h-3.5 text-blue-500 inline ml-1" />
  );
};

const statusOptions = [
  { value: "all", label: "Tutti" },
  { value: "active", label: "Attivi" },
  { value: "inactive", label: "Disiscritti" },
];

return (
  <div className="space-y-6">
    <Toaster position="top-center" reverseOrder={false} />

    {/* HEADER */}
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <h2 className="text-2xl font-bold text-gray-900">Contatti</h2>

      <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Cerca per nome, email o tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
              />
            </svg>
          </div>

          <div className="w-44">
            <Select options={statusOptions} value={statusFilter} onChange={setStatusFilter} className="text-sm" />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          {/* Scarica modello CSV */}
          <button
            onClick={() => {
              const headers = ["name,email,tags,tipologia_canale,periodicita_canale,copertura_canale,ruolo,settore,canale"];
              const exampleData = [
                "Mario Rossi,mario@email.com,cliente,Periodici specializzati,Quotidiano,Nazionale,Direttore Editoriale,Edilizia/Costruzioni;Architettura/Casa/Arredamento/Design,Sport - Atletica",
                "Giulia Verdi,giulia@email.com,prospect,Online specializzati,Settimanale,Nazionale,Capo Redattore,Information technology;Tecnologia/Innovazione,Sport acquatici",
              ];
              const csvContent = [headers, ...exampleData].join("\n");
              const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.setAttribute("download", "modello_contatti.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Scarica Modello
          </button>

          {/* Importa contatti CSV */}
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Importa CSV
          </button>

          {/* 🔥 NUOVO BOTTONE - Gestione Tag */}
          <button
    onClick={() => setShowTagsModal(true)}
    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
  >
    <Tag className="w-4 h-4" />
    Gestisci Tag
  </button>

          {/* Aggiungi contatto */}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuovo Contatto
          </button>
        </div>
      </div>
    </div>

    {/* TABELLA CONTATTI */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th onClick={() => requestSort("name")} className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase cursor-pointer select-none">
                Contatto <SortIcon column="name" />
              </th>
              <th onClick={() => requestSort("status")} className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase cursor-pointer select-none">
                Stato <SortIcon column="status" />
              </th>
              <th onClick={() => requestSort("tags")} className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase cursor-pointer select-none">
                Tag <SortIcon column="tags" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Azioni</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentContacts.length > 0 ? (
              currentContacts.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{c.name}</div>
                      <div className="text-sm text-gray-500">{c.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(c.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${c.status === "active"
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                    >
                      {c.status === "active" ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" /> Attivo
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" /> Disiscritto
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-1 flex-wrap">
                      {c.tags.map((t, i) => (
                        <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                    <button
                      onClick={() => {
                        console.log('🔵 Click modifica, contatto:', c);
                        setSelectedContact(c);
                        setShowEditModal(true);
                        console.log('🔵 Stati impostati');
                      }}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedContact(c);
                        setShowDeleteModal(true);
                      }}
                      className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-6 text-gray-500 text-sm">
                  Nessun contatto trovato
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINAZIONE */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
        <div>
          {totalContacts > 0
            ? `Mostrati ${startIndex + 1}-${Math.min(endIndex, totalContacts)} di ${totalContacts} contatti`
            : "Nessun contatto disponibile"}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm transition-colors ${
              currentPage === 1
                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            <ChevronLeft className="w-4 h-4" /> Precedente
          </button>
          <span className="px-2">
            Pagina <strong>{currentPage}</strong> di {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm transition-colors ${
              currentPage === totalPages
                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            Successivo <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
    {showTagsModal && (
        <TagsManagementModal
          show={showTagsModal}
          onClose={() => setShowTagsModal(false)}
          user={user}
        />
      )}
    {/* ⚠️ Modale conferma disiscrizione */}
{showDeactivateConfirm && contactToDeactivate && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center border-t-4 border-red-600">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        Disiscrivere {contactToDeactivate.name}?
      </h3>
      <p className="text-sm text-gray-600 mb-5">
        Il contatto non riceverà più comunicazioni email fino a una nuova attivazione.
      </p>
      <div className="flex justify-center gap-3">
        <button
          onClick={cancelDeactivate}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
        >
          Annulla
        </button>
        <button
          onClick={confirmDeactivate}
          className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
        >
          Disiscrivi
        </button>
      </div>
    </div>
  </div>
)}



      {/* MODALI */}
      {showAddModal && (
  <ContactModal
    show={showAddModal}
    onClose={() => setShowAddModal(false)}
    onAdd={handleAddContact}
    user={user} // 👈 passa user.id qui
  />
)}

    {console.log('🟢 showEditModal:', showEditModal, 'selectedContact:', selectedContact)}
{showEditModal && selectedContact && (
  <>
    {console.log('🟢 Rendering EditContactModal con:', selectedContact)}
    <EditContactModal
      show={showEditModal}
      contact={selectedContact}
      onClose={() => {
        console.log('🔴 Chiusura modale');
        setShowEditModal(false);
        setSelectedContact(null);
      }}
      onSave={handleEditContact}
      sectors={sectors}
      channels={channels}
      roles={roles}
      onOpenSectorsModal={() => setShowSectorsModal(true)}
      onOpenChannelsModal={() => setShowChannelsModal(true)}
      onOpenRolesModal={() => setShowRolesModal(true)}
    />
  </>
)}

      {showDeleteModal && selectedContact && (
        <DeleteConfirmModal
          contact={selectedContact}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}

      {showImportModal && (
        <ImportContactsModal
          show={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={handleImportContacts}
          existingContacts={contacts}
        />
      )}
    </div>
  );
};

// =============================================================================
// INTEGRAZIONE BUTTON EDITOR NEL CAMPAIGNMODAL - DA INSERIRE IN EMAILPLATFORM
// =============================================================================

// 🎯 ISTRUZIONI: Cerca "const CampaignModal" nel tuo EmailPlatform.jsx e sostituisci 
// l'intero componente CampaignModal con questo codice

// =====================================================================
// 🆕 COMPONENTE BUTTON EDITOR AVANZATO (DA AGGIUNGERE PRIMA DI CampaignModal)
// =====================================================================
const ButtonEditor = ({ 
  buttonText, 
  setButtonText,
  buttonLink,
  setButtonLink,
  buttonColor,
  setButtonColor,
  buttonTextColor,
  setButtonTextColor,
  openInNewTab,
  setOpenInNewTab,
  // Props per gli stili (passati dal parent)
  buttonAlignment,
  setButtonAlignment,
  buttonSize,
  setButtonSize,
  buttonShape,
  setButtonShape,
  borderType,
  setBorderType,
  borderWidth,
  setBorderWidth,
  borderColor,
  setBorderColor,
  paddingTop,
  setPaddingTop,
  paddingBottom,
  setPaddingBottom,
  paddingLeft,
  setPaddingLeft,
  paddingRight,
  setPaddingRight,
  applyPaddingAll,
  setApplyPaddingAll,
  onSave,
  onCancel
}) => {
  // ✅ SOLO questo stato locale (per i tab)
  const [activeTab, setActiveTab] = useState('contenuto');
  
  

  // Calcola stili in base alle impostazioni
  const getButtonStyles = () => {
    const sizeStyles = {
      piccolo: { fontSize: '14px' },
      medio: { fontSize: '16px' },
      grande: { fontSize: '18px' }
    };

    const shapeStyles = {
      quadrato: '0px',
      rotondo: '5px',
      pillola: '50px'
    };

    const paddingValue = applyPaddingAll 
      ? `${paddingTop}px` 
      : `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`;

    const borderValue = borderWidth > 0 && borderType !== 'none'
      ? `${borderWidth}px ${borderType} ${borderColor}`
      : 'none';

    return {
      background: buttonColor,
      color: buttonTextColor,
      padding: paddingValue,
      textDecoration: 'none',
      borderRadius: shapeStyles[buttonShape],
      display: 'inline-block',
      fontWeight: 'bold',
      fontSize: sizeStyles[buttonSize].fontSize,
      cursor: 'pointer',
      transition: 'all 0.3s',
      border: borderValue
    };
  };

  const getAlignmentStyle = () => {
    const alignments = {
      left: 'flex-start',
      center: 'center',
      right: 'flex-end'
    };
    return alignments[buttonAlignment];
  };
  // const [isRestoring, setIsRestoring] = useState(false);

// Modifica l'useEffect di salvataggio
useEffect(() => {
  console.log('💾 Save effect triggered:', { 
    showSectionEditor, 
    editingSectionData: !!editingSectionData, 
    isRestoring 
  });
  
  // 🔥 Durante il restore, IGNORA COMPLETAMENTE qualsiasi cambiamento
  if (isRestoring) {
    console.log('⏸️ LOCKED - Ignoring all changes during restore');
    return;
  }
  
  if (showSectionEditor && editingSectionData) {
    const stateToSave = {
      showSectionEditor: true,
      editingSectionData,
      columnStyles,
      timestamp: Date.now()
    };
    console.log('✅ Saving to sessionStorage:', stateToSave);
    sessionStorage.setItem('emailEditorState', JSON.stringify(stateToSave));
  }
}, [showSectionEditor, editingSectionData, columnStyles, isRestoring]);

// Modifica l'useEffect di ripristino
useEffect(() => {
  console.log('🔄 Restore effect: Component mounted');
  
  const restoreState = () => {
    if (hasRestoredRef.current) {
      console.log('⏸️ Già ripristinato in questa sessione');
      return;
    }
    
    if (showSectionEditor) {
      console.log('⏸️ Editor già aperto, skip restore');
      return;
    }
    
    console.log('🔍 Checking for saved state...');
    const savedState = sessionStorage.getItem('emailEditorState');
    
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        console.log('📦 Parsed state:', parsed);
        
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - parsed.timestamp < oneHour) {
          console.log('✅ Restoring state...');
          
          // 🔥 BLOCCA TUTTO per 3 secondi
          setIsRestoring(true);
          
          // 🔥 Usa setTimeout per dare tempo al componente di stabilizzarsi
          setTimeout(() => {
            setShowSectionEditor(true);
            setEditingSectionData(parsed.editingSectionData);
            setColumnStyles(parsed.columnStyles || {});
            
            hasRestoredRef.current = true;
            
            // 🔥 Sblocca dopo 3 secondi
            setTimeout(() => {
              // setIsRestoring(false);
              closeEditor();
              console.log('🔓 Restore complete - unlocking after 3 seconds');
            }, 3000); // ← 3 secondi di blocco
            
            if (!isPageLoadRef.current) {
              toast.success('📝 Editor ripristinato', { duration: 2000 });
            }
          }, 500); // ← Delay iniziale di 500ms
          
        } else {
          // sessionStorage.removeItem('emailEditorState');
          closeEditor();
        }
      } catch (e) {
        console.error('❌ Error parsing state:', e);
        // sessionStorage.removeItem('emailEditorState');
        closeEditor();
      }
    }
  };

  restoreState();
  
  setTimeout(() => {
    isPageLoadRef.current = false;
  }, 1000);
  
}, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex"
      >
        {/* Sidebar Configurazione */}
        <div className="w-96 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Pulsante</h3>
              <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <div className="flex border-b border-gray-200">
                <button 
                  onClick={() => setActiveTab('contenuto')}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'contenuto' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Contenuto
                </button>
                <button 
                  onClick={() => setActiveTab('stili')}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'stili' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Stili
                </button>
                <button 
                  onClick={() => setActiveTab('visibilita')}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'visibilita' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Visibilità
                </button>
              </div>
            </div>

            {/* TAB CONTENUTO */}
            {activeTab === 'contenuto' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Testo del pulsante
                  </label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Es. Scarica il Comunicato Stampa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link a
                  </label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-3">
                    <option value="web">Web</option>
                    <option value="email">Email</option>
                    <option value="file">File</option>
                  </select>

                  <input
                    type="url"
                    value={buttonLink}
                    onChange={(e) => setButtonLink(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="https://esempio.com"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="newTab"
                    checked={openInNewTab}
                    onChange={(e) => setOpenInNewTab(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="newTab" className="text-sm text-gray-700">
                    Apri link in una nuova scheda
                  </label>
                </div>
              </div>
            )}

            {/* TAB STILI */}
            {activeTab === 'stili' && (
              <div className="space-y-5">
                <p className="text-xs text-gray-500 uppercase font-semibold">Tutti i dispositivi</p>

                {/* Forma */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Forma</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setButtonShape('quadrato')}
                      className={`p-3 border-2 rounded-lg text-sm font-medium transition ${
                        buttonShape === 'quadrato'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Quadrato
                    </button>
                    <button
                      onClick={() => setButtonShape('rotondo')}
                      className={`p-3 border-2 rounded-lg text-sm font-medium transition ${
                        buttonShape === 'rotondo'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Rotondo
                    </button>
                    <button
                      onClick={() => setButtonShape('pillola')}
                      className={`p-3 border-2 rounded-lg text-sm font-medium transition ${
                        buttonShape === 'pillola'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      A pillola
                    </button>
                  </div>
                </div>

                {/* Bordo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bordo</label>
                  <select 
                    value={borderType}
                    onChange={(e) => setBorderType(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-3"
                  >
                    <option value="none">Nessuno</option>
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>

                  {borderType !== 'none' && (
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={borderWidth}
                        onChange={(e) => setBorderWidth(Number(e.target.value))}
                        className="flex-1 p-2 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="color"
                        value={borderColor}
                        onChange={(e) => setBorderColor(e.target.value)}
                        className="w-12 h-12 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Colori */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Colori</label>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-sm text-gray-700">Pulsante</span>
                      <input
                        type="color"
                        value={buttonColor}
                        onChange={(e) => setButtonColor(e.target.value)}
                        className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-sm text-gray-700">Testo</span>
                      <input
                        type="color"
                        value={buttonTextColor}
                        onChange={(e) => setButtonTextColor(e.target.value)}
                        className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Allineamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Allineamento</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setButtonAlignment('left')}
                      className={`p-3 border-2 rounded-lg text-sm font-medium transition ${
                        buttonAlignment === 'left'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Sinistra
                    </button>
                    <button
                      onClick={() => setButtonAlignment('center')}
                      className={`p-3 border-2 rounded-lg text-sm font-medium transition ${
                        buttonAlignment === 'center'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Centro
                    </button>
                    <button
                      onClick={() => setButtonAlignment('right')}
                      className={`p-3 border-2 rounded-lg text-sm font-medium transition ${
                        buttonAlignment === 'right'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Destra
                    </button>
                  </div>
                </div>

                {/* Dimensione */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Dimensione</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setButtonSize('piccolo')}
                      className={`p-3 border-2 rounded-lg text-sm font-medium transition ${
                        buttonSize === 'piccolo'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Piccolo
                    </button>
                    <button
                      onClick={() => setButtonSize('medio')}
                      className={`p-3 border-2 rounded-lg text-sm font-medium transition ${
                        buttonSize === 'medio'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Medio
                    </button>
                    <button
                      onClick={() => setButtonSize('grande')}
                      className={`p-3 border-2 rounded-lg text-sm font-medium transition ${
                        buttonSize === 'grande'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Grande
                    </button>
                  </div>
                </div>

                {/* Padding */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">Padding</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="applyAll"
                        checked={applyPaddingAll}
                        onChange={(e) => setApplyPaddingAll(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                      />
                      <label htmlFor="applyAll" className="text-xs text-gray-600">
                        Applica a tutti i lati
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Lato superiore</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={paddingTop}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPaddingTop(val);
                          if (applyPaddingAll) {
                            setPaddingBottom(val);
                            setPaddingLeft(val);
                            setPaddingRight(val);
                          }
                        }}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Lato inferiore</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={paddingBottom}
                        onChange={(e) => setPaddingBottom(Number(e.target.value))}
                        disabled={applyPaddingAll}
                        className="w-full p-2 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Lato sinistro</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={paddingLeft}
                        onChange={(e) => setPaddingLeft(Number(e.target.value))}
                        disabled={applyPaddingAll}
                        className="w-full p-2 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Lato destro</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={paddingRight}
                        onChange={(e) => setPaddingRight(Number(e.target.value))}
                        disabled={applyPaddingAll}
                        className="w-full p-2 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB VISIBILITÀ */}
            {activeTab === 'visibilita' && (
              <div className="space-y-5">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-4">Specifico per il dispositivo</p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="syncStyles"
                      defaultChecked
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded mt-1"
                    />
                    <label htmlFor="syncStyles" className="flex-1">
                      <span className="block text-sm font-medium text-gray-900 mb-1">
                        Collega stili per desktop e dispositivi mobili
                      </span>
                      <span className="text-xs text-gray-600">
                        Le modifiche alla dimensione del carattere verranno applicate quando l'email viene visualizzata su un dispositivo desktop.
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Pulsanti Azione */}
            <div className="mt-6 space-y-3">
              <button
                onClick={onSave}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Aggiungi Pulsante
              </button>
              <button
                onClick={onCancel}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>

        {/* Area Preview */}
        <div className="flex-1 bg-white p-8 overflow-y-auto">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Anteprima</h4>
              <div className="flex gap-2">
                <button className="p-2 border border-gray-300 rounded hover:bg-gray-50">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                </button>
                <button className="p-2 border border-gray-300 rounded hover:bg-gray-50">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="5" y="2" width="14" height="20" rx="2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Preview del Pulsante */}
          <div className="border-2 border-gray-200 rounded-lg p-12 bg-gray-50">
            <div className="bg-white shadow-sm rounded-lg p-8 max-w-2xl mx-auto">
              <div style={{ 
                padding: '20px', 
                display: 'flex',
                justifyContent: getAlignmentStyle()
              }}>
                <a 
                  href={buttonLink || '#'} 
                  target={openInNewTab ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  style={getButtonStyles()}
                >
                  {buttonText || 'Testo del pulsante'}
                </a>
              </div>

              {/* Info sotto il pulsante */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">Link configurato</p>
                    <p className="text-xs text-blue-700 mt-1 break-all">
                      {buttonLink || 'Nessun link'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info stili attivi */}
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>🎨 Stili attivi:</strong> Forma: {buttonShape} • Dimensione: {buttonSize} • Allineamento: {buttonAlignment}
              {borderType !== 'none' && ` • Bordo: ${borderWidth}px ${borderType}`}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};



// =====================================================================
// CAMPAIGNMODAL AGGIORNATO CON SCELTA TRA CAMPAGNA NORMALE E TEMPLATE
// =====================================================================

const CampaignModal = ({ 
  showCampaignModal,
  setShowCampaignModal,
  campaignMode,
  setCampaignMode,
  contacts,
  onSaveDraft,
  editingCampaign, // ✅ Nuova prop
  skipModeSelection, // ✅ Ricevi la prop
  onCloseBuilder, // ✅ Assicurati che sia qui
  setActiveTab
}) => {

 // 🔥 EARLY RETURN PRIMA DI QUALSIASI HOOK
  if (!showCampaignModal) {
    console.log('⏭️ CampaignModal skipped (showCampaignModal=false)');
    return null;
  }

  console.log('🔍 CampaignModal render:', {
    showCampaignModal,
    campaignMode,
    hasEditingCampaign: !!editingCampaign
  });

  // ✅ ORA puoi usare gli hooks
  const {
    showSectionEditor,
    setShowSectionEditor,
    editingSectionData,
    setEditingSectionData,
    columnStyles,
    setColumnStyles,
    isRestoring,
    closeEditor
  } = useEditorState();

  useEffect(() => {
    // CASO 1: Se stiamo modificando una campagna tramite editingCampaign prop
    if (editingCampaign && showCampaignModal && campaignMode === null) {
      console.log('🔥 Forcing builder mode for editing campaign (from prop)');
      setCampaignMode('builder');
      return;
    }
    
    // CASO 2: Se ci sono dati nel sessionStorage (da EditCampaignModal)
    const editingId = sessionStorage.getItem('editingCampaignId');
    const savedBlocks = sessionStorage.getItem('builderBlocks');
    
    if (editingId && savedBlocks && campaignMode === null && showCampaignModal) {
      console.log('🔥 Forcing builder mode (from sessionStorage)');
      setCampaignMode('builder');
    }
  }, [editingCampaign, showCampaignModal, campaignMode]);

  console.log('🎬 CampaignModal RENDER - showSectionEditor:', showSectionEditor);
    // Stati principali
  // const [campaignMode, setCampaignMode] = useState(null); // null | 'normal' | 'template' | 'builder'
  const [socialEditor, setSocialEditor] = useState({
    open: false,
    index: null,    // quale blocco social è editato
    items: [],      // social correnti
  });

  const [templatePreviewWidth, setTemplatePreviewWidth] = useState('desktop');
  const [editorKey, setEditorKey] = useState(0); // ← AGGIUNGI QUESTO
  // Aggiungi questo stato all'inizio del componente
const [isSelecting, setIsSelecting] = useState(false);
const [allAccounts, setAllAccounts] = useState([]); // 🔥 Nuovo state per account globali
const [loadingAccounts, setLoadingAccounts] = useState(false);

const [loadingAllAccounts, setLoadingAllAccounts] = useState(false);
const [showSingleBlockEditor, setShowSingleBlockEditor] = useState(false);
const [editingSingleBlock, setEditingSingleBlock] = useState(null);
const [blockEditorRestoreLock, setBlockEditorRestoreLock] = useState(false); // ← Nuovo
const [localContacts, setLocalContacts] = useState([]);
// Funzione per caricare TUTTI gli account
const fetchAllAccounts = async () => {
  setLoadingAllAccounts(true);
  try {
    const { data, error } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('verified', true)
      .order('is_default', { ascending: false });

    if (error) throw error;

    console.log('📧 Tutti gli account caricati:', data);
    setAllAccounts(data || []);
  } catch (error) {
    console.error('❌ Errore:', error);
    toast.error('Errore nel caricamento degli account');
  } finally {
    setLoadingAllAccounts(false);
  }
};

// Carica quando apri il modale campagna
useEffect(() => {
  if (showCampaignModal) {
    fetchAllAccounts();
  }
}, [showCampaignModal]);
// 🧩 Estrae i contenuti strutturali dal blocco HTML
const parseHeroContent = () => {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = editingSingleBlock.html || "";

  return {
    title: wrapper.querySelector("h1, h2, h3")?.textContent || "",
    subtitle: wrapper.querySelector("p")?.textContent || "",
    buttonText: wrapper.querySelector("a, button")?.textContent || "",
    buttonLink: wrapper.querySelector("a")?.getAttribute("href") || "",
  };
};

useEffect(() => {
  const editingId = sessionStorage.getItem('editingCampaignId');
  const savedData = sessionStorage.getItem('editingCampaignData');
  const builderContent = sessionStorage.getItem('currentEmailContent');
  const savedBlocks = sessionStorage.getItem('builderBlocks');
  
  // 🔥 CASO 1: Modalità NORMAL con dati salvati (da EditCampaignModal)
  if (editingId && savedData && campaignMode === 'normal' && showCampaignModal) {
    console.log('✅ Loading editing campaign data in NORMAL mode');
    
    const data = JSON.parse(savedData);
    
    setCampaignName(data.campaign_name || '');
    setSubject(data.subject || '');
    setSelectedAccount(data.sender_email || '');
    setCc(data.cc || '');
    setBcc(data.bcc || '');
    setRecipientList(data.recipient_list || []);
    setAttachments(data.attachments || []);
    
    if (builderContent) {
      setEmailContent(builderContent);
    }
    
    setIsBuilderTemplate(true);
    toast.success('📝 Campagna caricata!', { duration: 2000 });
  }
  
  // 🔥 CASO 2: Modalità BUILDER
  else if (campaignMode === 'builder' && showCampaignModal) {
    console.log('✅ Loading editing campaign data in BUILDER mode');
    
    // ✅ Controlla PRIMA il sessionStorage (da EditCampaignModal)
    if (editingId && savedData && savedBlocks) {
      console.log('📦 Loading from sessionStorage');
      
      const data = JSON.parse(savedData);
      const blocks = JSON.parse(savedBlocks);
      
      setCampaignName(data.campaign_name || '');
      setSubject(data.subject || '');
      setSelectedAccount(data.sender_email || '');
      setCc(data.cc || '');
      setBcc(data.bcc || '');
      setRecipientList(data.recipient_list || []);
      setAttachments(data.attachments || []);
      
      if (builderContent) {
        setEmailContent(builderContent);
      }
      
      setCanvasBlocks(blocks);
      
      toast.success('📝 Campagna caricata nel builder!', { duration: 2000 });
    }
    // ✅ Altrimenti usa editingCampaign (se esiste)
    else if (editingCampaign) {
      console.log('📦 Loading from editingCampaign prop');
      
      setCampaignName(editingCampaign.campaign_name || '');
      setSubject(editingCampaign.subject || '');
      setSelectedAccount(editingCampaign.sender_email || '');
      setCc(editingCampaign.cc || '');
      setBcc(editingCampaign.bcc || '');
      setRecipientList(editingCampaign.recipient_list || []);
      setAttachments(editingCampaign.attachments || []);
      setEmailContent(editingCampaign.email_content || '');
      
      sessionStorage.setItem('builderTemplate', editingCampaign.email_content);
      sessionStorage.setItem('currentEmailContent', editingCampaign.email_content);
      sessionStorage.setItem('isBuilderTemplate', 'true');
      sessionStorage.setItem('editingCampaignId', editingCampaign.id);
      
      const contentBlock = {
        id: 'predefined-template',
        name: 'Template da Modifica',
        icon: '📄',
        category: 'layout',
        html: editingCampaign.email_content,
        instanceId: `edit-${Date.now()}`
      };
      
      sessionStorage.setItem('builderBlocks', JSON.stringify([contentBlock]));
      setCanvasBlocks([contentBlock]);
      
      toast.success('📝 Campagna caricata nel builder!', { duration: 2000 });
    }
  }
}, [campaignMode, showCampaignModal, editingCampaign]);
// 🔧 Aggiorna dinamicamente titolo, sottotitolo e pulsante
const updateHeroContent = (prop, value) => {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = editingSingleBlock.html || "";

  const title = wrapper.querySelector("h1, h2, h3");
  const subtitle = wrapper.querySelector("p");
  const button = wrapper.querySelector("a, button");

  if (prop === "title" && title) title.textContent = value;
  if (prop === "subtitle" && subtitle) subtitle.textContent = value;
  if (prop === "buttonText" && button) button.textContent = value;
  if (prop === "buttonLink" && button?.tagName === "A") {
    button.setAttribute("href", value);
  }

  setEditingSingleBlock({
    ...editingSingleBlock,
    html: wrapper.innerHTML,
  });
};

// 🎨 Applica uno style inline al blocco
const updateSingleStyle = (prop, value) => {
  let wrapper = document.createElement("div");
  wrapper.innerHTML = editingSingleBlock.html;

  const root = wrapper.firstElementChild;

  if (!root) return;

  root.style[prop] = value;

  setEditingSingleBlock({
    ...editingSingleBlock,
    html: wrapper.innerHTML,
    styles: {
      ...editingSingleBlock.styles,
      [prop]: value
    }
  });
};

useEffect(() => {
  console.log('👁️ Contatti ricevuti nel modal:', contacts?.length || 0, contacts);
}, [contacts]);

// ✅ Sincronizza lo stato locale con la prop
useEffect(() => {
  if (contacts && contacts.length > 0) {
    setLocalContacts(contacts);
  } else if (user?.id) {
    fetchContacts();
  }
}, [contacts, user?.id]);
// 🔘 Modifica stile pulsante
const updateButtonStyle = (prop, value) => {
  let wrapper = document.createElement("div");
  wrapper.innerHTML = editingSingleBlock.html;

  const btn = wrapper.querySelector("button, a");

  if (!btn) return;

  btn.style[prop] = value;

  setEditingSingleBlock({
    ...editingSingleBlock,
    html: wrapper.innerHTML
  });
};
// 🔽 POI le funzioni
const fetchContacts = async () => {
  if (!user?.id) return;

  try {
    const res = await fetch(`/api/contacts?user_id=${user.id}`);
    const result = await res.json();

    if (result.success) {
      setLocalContacts(result.data || []);
      console.log('✅ Contatti caricati:', result.data?.length || 0);
    }
  } catch (err) {
    console.error("💥 Errore caricamento contatti:", err);
  }
};

function parseImageBlock(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  const img = div.querySelector("img");

  return {
    src: img?.getAttribute("src") || "",
    alt: img?.getAttribute("alt") || "",
    borderRadius: img?.style.borderRadius || "0px",
    width: img?.style.width || "100%",
  };
}
function parseTextBlock(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  const p = div.querySelector("p");

  return {
    text: p?.innerText || "",
    color: p?.style.color || "#000000",
    fontSize: p?.style.fontSize || "16px",
    lineHeight: p?.style.lineHeight || "1.6",
  };
}
function parseButtonBlock(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  const a = div.querySelector("a");

  return {
    text: a?.innerText || "",
    link: a?.getAttribute("href") || "#",
    bg: a?.style.background || "#667eea",
    color: a?.style.color || "white",
    padding: a?.style.padding || "15px 40px",
    radius: a?.style.borderRadius || "5px",
  };
}
function parseDividerBlock(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  const hr = div.querySelector("hr");

  return {
    color: hr?.style.borderTopColor || "#e5e7eb",
    thickness: hr?.style.borderTopWidth || "2px",
    margin: hr?.style.margin || "20px 0",
  };
}
function parseSocialBlock(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  const links = [...div.querySelectorAll("a")];

  return {
    facebook: links[0]?.getAttribute("href") || "#",
    twitter: links[1]?.getAttribute("href") || "#",
    instagram: links[2]?.getAttribute("href") || "#",
  };
}


// 🆕 AGGIUNGI QUESTO STATO QUI
// const [isRestoring, setIsRestoring] = useState(false);
const [tiptapEditor, setTiptapEditor] = useState(null);
  // Aggiungi questo componente all'inizio del file, prima del componente principale
const ContentEditableDiv = ({ value, onChange, columnIndex, style }) => {
  const ref = useRef(null);
  const [isEditing, setIsEditing] = useState(false);





  useEffect(() => {
    console.log('🎭 CampaignModal MOUNTED');
    return () => {
      console.log('💀 CampaignModal UNMOUNTED');
    };
  }, []);

  
  useEffect(() => {
    if (ref.current && !isEditing) {
      // Aggiorna solo se non si sta editando
      if (ref.current.innerHTML !== value) {
        ref.current.innerHTML = value;
      }
    }
  }, [value, isEditing]);

  const handleInput = (e) => {
    onChange(e.currentTarget.innerHTML);
  };
  if (!showCampaignModal) {
    return null;
  }

  return (
    <div
      ref={ref}
      contentEditable
      data-column={columnIndex}
      suppressContentEditableWarning
      onFocus={() => setIsEditing(true)}
      onBlur={() => {
        setIsEditing(false);
        onChange(ref.current.innerHTML);
      }}
      onInput={handleInput}
      className="w-full min-h-[100px] p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      style={{
        ...style,
        outline: 'none'
      }}
    />
  );
};



  // 📚 Template predefiniti (stile MailChimp)
  const templates = [
    {
      id: 1,
      name: "Newsletter Base",
      preview: "📰",
      thumbnail: "https://via.placeholder.com/300x400/3B82F6/FFFFFF?text=Newsletter",
      description: "Template semplice per newsletter con header e contenuto",
      category: "newsletter",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px;">La Tua Newsletter</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Rimani aggiornato sulle ultime novità</p>
          </div>
          <div style="padding: 40px 20px;">
            <h2 style="color: #333333; font-size: 24px; margin-bottom: 20px;">Titolo Articolo</h2>
            <p style="color: #666666; line-height: 1.6; font-size: 16px;">Inserisci qui il contenuto della tua newsletter.</p>
          </div>
        </div>`
    },
  
    {
      id: 2,
      name: "Promo Aziendale",
      preview: "🏢",
      thumbnail: "https://via.placeholder.com/300x400/10B981/FFFFFF?text=Promo",
      description: "Template elegante per comunicazioni aziendali",
      category: "business",
      html: `
        <div style="font-family: Arial; max-width: 600px; margin: auto; background:#ffffff;">
          <div style="background:#10B981; text-align:center; padding:40px 20px; color:white;">
            <h1 style="margin:0; font-size:28px;">Promozione Speciale</h1>
            <p style="opacity:.85;">Offerta valida fino ad esaurimento</p>
          </div>
          <div style="padding:30px;">
            <p style="color:#333333; font-size:16px; line-height:1.6">
              Scopri le nostre nuove offerte esclusive dedicate ai clienti aziendali.
            </p>
            <a href="#" style="display:inline-block; margin-top:20px; padding:12px 24px; background:#10B981; color:white; border-radius:6px; text-decoration:none;">
              Scopri di più
            </a>
          </div>
        </div>`
    },
  
    {
      id: 3,
      name: "E-Commerce Product",
      preview: "🛒",
      thumbnail: "https://via.placeholder.com/300x400/F97316/FFFFFF?text=Product",
      description: "Template ideale per vendita prodotti",
      category: "ecommerce",
      html: `
        <div style="max-width:600px; margin:auto; font-family:Arial;">
          <div style="text-align:center; padding:20px;">
            <img src="https://via.placeholder.com/600x300" style="width:100%; border-radius:10px;">
          </div>
          <div style="padding:20px;">
            <h2 style="font-size:24px; margin-bottom:10px;">Nome del Prodotto</h2>
            <p style="color:#555;">Descrizione breve del prodotto e sue caratteristiche principali.</p>
            <p style="font-size:22px; color:#F97316; font-weight:bold;">€ 19,99</p>
            <a href="#" style="background:#F97316; padding:14px 24px; color:white; border-radius:6px; text-decoration:none;">Acquista ora</a>
          </div>
        </div>`
    },
  
    {
      id: 4,
      name: "Evento / Webinar",
      preview: "🎤",
      thumbnail: "https://via.placeholder.com/300x400/6366F1/FFFFFF?text=Evento",
      description: "Template dedicato a inviti per eventi e webinar",
      category: "events",
      html: `
        <div style="max-width:600px; margin:auto; font-family:Arial; background:#ffffff;">
          <div style="padding:40px; background:#6366F1; color:white; text-align:center;">
            <h1 style="margin:0;">Titolo del Webinar</h1>
            <p style="margin-top:10px; opacity:.9;">Partecipa al nostro prossimo evento!</p>
          </div>
          <div style="padding:20px;">
            <p style="color:#333333; font-size:16px;">📅 Data: 10 Dicembre</p>
            <p style="color:#333333; font-size:16px;">⏰ Orario: 15:00</p>
            <a href="#" style="margin-top:20px; display:inline-block; background:#6366F1; color:white; padding:12px 20px; border-radius:5px; text-decoration:none;">Iscriviti ora</a>
          </div>
        </div>`
    },
  
    {
      id: 5,
      name: "Black Friday",
      preview: "🖤",
      thumbnail: "https://via.placeholder.com/300x400/000000/FFFFFF?text=BlackFriday",
      description: "Template promozionale per super sconti",
      category: "ecommerce",
      html: `
        <div style="max-width:600px;margin:auto;background:black;color:white;font-family:Arial;text-align:center;padding:40px;">
          <h1 style="font-size:40px;margin:0;">BLACK FRIDAY</h1>
          <p style="margin-top:10px;font-size:18px;">Sconti fino al <strong>70%</strong></p>
          <a href="#" style="display:inline-block;margin-top:25px;background:white;color:black;padding:12px 24px;border-radius:5px;text-decoration:none;font-weight:bold;">
            Vai allo shop
          </a>
        </div>`
    },
  
    {
      id: 6,
      name: "Ristorante / Menu",
      preview: "🍝",
      thumbnail: "https://via.placeholder.com/300x400/DC2626/FFFFFF?text=Food",
      description: "Template perfetto per promuovere ristoranti",
      category: "food",
      html: `
        <div style="max-width:600px; margin:auto; font-family:Georgia;">
          <div style="background:#DC2626;color:white;padding:40px;text-align:center;">
            <h1 style="margin:0;">Menù della Settimana</h1>
          </div>
          <div style="padding:20px;">
            <h2>🍝 Primo</h2>
            <p>Pasta fresca con ingredienti locali</p>
            <h2>🍖 Secondo</h2>
            <p>Tagliata di manzo con contorni</p>
          </div>
        </div>`
    },
  
    {
      id: 7,
      name: "Travel / Vacanze",
      preview: "✈️",
      thumbnail: "https://via.placeholder.com/300x400/0EA5E9/FFFFFF?text=Travel",
      description: "Template per agenzie viaggi",
      category: "travel",
      html: `
        <div style="max-width:600px;margin:auto;font-family:Arial;">
          <img src="https://via.placeholder.com/600x250?text=Vacanze" style="width:100%;">
          <div style="padding:20px;">
            <h2>Promozione Viaggio</h2>
            <p>Scopri le nostre offerte per le tue prossime vacanze!</p>
            <a href="#" style="display:inline-block;background:#0EA5E9;color:white;padding:12px 22px;border-radius:5px;text-decoration:none;">Prenota ora</a>
          </div>
        </div>`
    },
  
    {
      id: 8,
      name: "Welcome Email",
      preview: "👋",
      thumbnail: "https://via.placeholder.com/300x400/14B8A6/FFFFFF?text=Welcome",
      description: "Email di benvenuto elegante",
      category: "welcome",
      html: `
        <div style="max-width:600px;font-family:Arial;margin:auto;background:#ffffff;">
          <div style="padding:40px;text-align:center;background:#14B8A6;color:white;">
            <h1>Benvenuto!</h1>
          </div>
          <div style="padding:20px;font-size:16px;color:#444;">
            Siamo felici che tu sia con noi. Ecco cosa puoi aspettarti...
          </div>
        </div>`
    },
  
    {
      id: 9,
      name: "Corso / Academy",
      preview: "🎓",
      thumbnail: "https://via.placeholder.com/300x400/7C3AED/FFFFFF?text=Academy",
      description: "Template per promuovere corsi e formazione",
      category: "education",
      html: `
        <div style="max-width:600px;font-family:Arial;margin:auto;">
          <div style="background:#7C3AED;color:white;text-align:center;padding:40px;">
            <h1>Nuovo Corso Disponibile</h1>
          </div>
          <div style="padding:20px;">
            <p>Impara nuove competenze con il nostro corso avanzato.</p>
          </div>
        </div>`
    },
  
    {
      id: 10,
      name: "Minimal Elegante",
      preview: "✨",
      thumbnail: "https://via.placeholder.com/300x400/F1F5F9/000000?text=Minimal",
      description: "Stile pulito e professionale",
      category: "newsletter",
      html: `
        <div style="max-width:600px;margin:auto;font-family:Helvetica;background:white;padding:40px;">
          <h1 style="margin:0;font-size:28px;">Titolo Minimal</h1>
          <p style="margin-top:20px;color:#555;">Questo template è perfetto per comunicazioni moderne.</p>
        </div>`
    },
  
    {
      id: 11,
      name: "Real Estate",
      preview: "🏠",
      thumbnail: "https://via.placeholder.com/300x400/475569/FFFFFF?text=RealEstate",
      description: "Template per vendite immobiliari",
      category: "real-estate",
      html: `
        <div style="max-width:600px;margin:auto;">
          <img src="https://via.placeholder.com/600x250?text=Casa" style="width:100%;">
          <div style="padding:20px;font-family:Arial;">
            <h2>Casa in Vendita</h2>
            <p>Scopri tutte le informazioni sulla proprietà.</p>
          </div>
        </div>`
    },
  
    {
      id: 12,
      name: "Natale",
      preview: "🎄",
      thumbnail: "https://via.placeholder.com/300x400/047857/FFFFFF?text=Natale",
      description: "Template festivo natalizio",
      category: "holidays",
      html: `
        <div style="max-width:600px;margin:auto;background:#047857;color:white;text-align:center;font-family:Arial;padding:40px;">
          <h1>Buon Natale!</h1>
          <p style="margin-top:10px;">Auguri da tutto il nostro team</p>
        </div>`
    }
  ];
 
  // Dopo gli altri useState, aggiungi questo useEffect
 // Ripristina emailContent al mount e quando cambia modalità
 useEffect(() => {
  if (campaignMode === 'normal') {
    const savedTemplate = sessionStorage.getItem('builderTemplate');
    
    // 🔥 Carica il template SOLO se esiste
    if (savedTemplate) {
      console.log('✅ Caricamento template dal builder');
      setEmailContent(savedTemplate);
      setIsBuilderTemplate(true);
      sessionStorage.setItem('currentEmailContent', savedTemplate);
      sessionStorage.setItem('isBuilderTemplate', 'true');
      setEditorKey(prev => prev + 1);
      sessionStorage.removeItem('builderTemplate');
      toast.success('✅ Template caricato!', { duration: 2000 });
    }
    // 🔥 Altrimenti non fare nulla - lascia emailContent al suo valore di default
  }
}, [campaignMode]);
// Ripristina isBuilderTemplate dal sessionStorage al mount
// Ripristina emailContent al mount e quando cambia modalità
useEffect(() => {
  const savedContent = sessionStorage.getItem('currentEmailContent');
  const savedFlag = sessionStorage.getItem('isBuilderTemplate');
  
  if (savedFlag === 'true' && savedContent) {
    console.log('✅ Ripristino template da sessionStorage');
    console.log('📄 Contenuto:', savedContent.substring(0, 100));
    setEmailContent(savedContent);
    setIsBuilderTemplate(true);
    setEditorKey(prev => prev + 1);
  }
}, [campaignMode]); // ← AGGIUNGI campaignMode come dipendenza
  // 🧩 BLOCCHI DISPONIBILI PER IL BUILDER
 // 🧩 BLOCCHI DISPONIBILI PER IL BUILDER
const contentBlocks = [
  // ========== 📐 SEZIONI LAYOUT ==========
  {
    id: 'section-1col',
    name: 'Sezione 1 Colonna',
    icon: '▭',
    category: 'layout',
    description: 'Layout a colonna singola',
    html: `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f4f4f4; padding:20px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background:#ffffff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <tr>
              <td style="padding:40px;">
                <h2 style="margin:0 0 20px; color:#333333; font-size:24px; font-weight:600;">Titolo Sezione</h2>
                <p style="margin:0; color:#666666; line-height:1.6; font-size:15px;">Inserisci il contenuto della tua sezione qui. Questo layout è perfetto per testi lunghi o contenuti singoli.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
  },
  
  {
    id: 'section-2col',
    name: 'Sezione 2 Colonne',
    icon: '▯',
    category: 'layout',
    description: 'Layout a due colonne affiancate',
    html: `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f4f4f4; padding:20px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background:#ffffff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <tr>
              <td width="50%" style="padding:30px; vertical-align:top;">
                <h3 style="margin:0 0 15px; color:#333333; font-size:18px; font-weight:600;">Colonna 1</h3>
                <p style="margin:0; color:#666666; font-size:14px; line-height:1.6;">Contenuto prima colonna. Perfetto per confronti o features side-by-side.</p>
              </td>
              <td width="50%" style="padding:30px; vertical-align:top; border-left:1px solid #eee;">
                <h3 style="margin:0 0 15px; color:#333333; font-size:18px; font-weight:600;">Colonna 2</h3>
                <p style="margin:0; color:#666666; font-size:14px; line-height:1.6;">Contenuto seconda colonna con stile identico per coerenza visiva.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
  },
  
  {
    id: 'section-3col',
    name: 'Sezione 3 Colonne',
    icon: '≡',
    category: 'layout',
    description: 'Layout a tre colonne per features',
    html: `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f4f4f4; padding:20px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background:#ffffff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <tr>
              <td width="33.33%" style="padding:20px; vertical-align:top; text-align:center;">
                <div style="font-size:32px; margin-bottom:10px;">📦</div>
                <h4 style="margin:0 0 10px; color:#333333; font-size:16px; font-weight:600;">Feature 1</h4>
                <p style="margin:0; color:#666666; font-size:13px; line-height:1.5;">Descrizione breve della prima caratteristica</p>
              </td>
              <td width="33.33%" style="padding:20px; vertical-align:top; text-align:center; border-left:1px solid #eee;">
                <div style="font-size:32px; margin-bottom:10px;">⚡</div>
                <h4 style="margin:0 0 10px; color:#333333; font-size:16px; font-weight:600;">Feature 2</h4>
                <p style="margin:0; color:#666666; font-size:13px; line-height:1.5;">Descrizione della seconda caratteristica</p>
              </td>
              <td width="33.33%" style="padding:20px; vertical-align:top; text-align:center; border-left:1px solid #eee;">
                <div style="font-size:32px; margin-bottom:10px;">🎯</div>
                <h4 style="margin:0 0 10px; color:#333333; font-size:16px; font-weight:600;">Feature 3</h4>
                <p style="margin:0; color:#666666; font-size:13px; line-height:1.5;">Descrizione della terza caratteristica</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
  },
  
  {
    id: 'section-hero',
    name: 'Hero Banner',
    icon: '🎨',
    category: 'layout',
    description: 'Sezione hero con sfondo gradiente',
    html: `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding:60px 20px;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600">
            <tr>
              <td style="text-align:center; color:#ffffff;">
                <h1 style="margin:0 0 20px; font-size:36px; font-weight:bold; text-shadow:0 2px 4px rgba(0,0,0,0.1);">Benvenuto nella Novità!</h1>
                <p style="margin:0 0 30px; font-size:18px; opacity:0.95; line-height:1.5;">Sottotitolo accattivante per catturare l'attenzione del lettore</p>
                <a href="#" style="display:inline-block; background:#ffffff; color:#667eea; padding:15px 40px; border-radius:50px; text-decoration:none; font-weight:bold; box-shadow:0 4px 15px rgba(0,0,0,0.2); transition:transform 0.2s;">
                  Scopri di più
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
  },
  
  {
    id: 'section-imgtext',
    name: 'Immagine + Testo',
    icon: '🖼️',
    category: 'layout',
    description: 'Immagine affiancata a contenuto testuale',
    html: `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff; padding:40px 20px;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600">
            <tr>
              <td width="40%" style="padding-right:20px; vertical-align:middle;">
                <img src="https://placehold.co/240x240/667eea/ffffff?text=Immagine" style="width:100%; max-width:240px; border-radius:8px; display:block; box-shadow:0 4px 12px rgba(0,0,0,0.1);" alt="Placeholder">
              </td>
              <td width="60%" style="padding-left:20px; vertical-align:middle;">
                <h3 style="margin:0 0 15px; color:#333333; font-size:24px; font-weight:600;">Titolo della Sezione</h3>
                <p style="margin:0 0 20px; color:#666666; line-height:1.6; font-size:15px;">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                <a href="#" style="color:#667eea; text-decoration:none; font-weight:600; font-size:15px;">Leggi di più →</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
  },
  
  {
    id: 'section-textimg',
    name: 'Testo + Immagine',
    icon: '📝',
    category: 'layout',
    description: 'Layout invertito: testo a sinistra',
    html: `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f8f9fa; padding:40px 20px;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600">
            <tr>
              <td width="60%" style="padding-right:20px; vertical-align:middle;">
                <h3 style="margin:0 0 15px; color:#333333; font-size:24px; font-weight:600;">Scopri di Più</h3>
                <p style="margin:0 0 20px; color:#666666; line-height:1.6; font-size:15px;">Questo layout permette di dare più spazio al testo mantenendo l'equilibrio visivo con l'immagine sulla destra.</p>
                <a href="#" style="display:inline-block; background:#667eea; color:#ffffff; padding:12px 28px; border-radius:6px; text-decoration:none; font-weight:600;">Scopri</a>
              </td>
              <td width="40%" style="padding-left:20px; vertical-align:middle;">
                <img src=https://placehold.co/240x240/667eea/ffffff?text=Immagine" style="width:100%; max-width:240px; border-radius:8px; display:block; box-shadow:0 4px 12px rgba(0,0,0,0.1);" alt="Visual">
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
  },
  
  {
    id: 'section-testimonial',
    name: 'Testimonial Box',
    icon: '💬',
    category: 'layout',
    description: 'Box per recensioni/testimonianze',
    html: `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f4f4f4; padding:40px 20px;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background:#ffffff; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.08); padding:40px;">
            <tr>
              <td style="text-align:center;">
                <div style="width:60px; height:60px; background:#667eea; border-radius:50%; margin:0 auto 20px; display:flex; align-items:center; justify-content:center; color:#ffffff; font-size:28px;">👤</div>
                <p style="margin:0 0 20px; color:#666666; font-size:16px; line-height:1.7; font-style:italic;">"Questa è una fantastica recensione del prodotto. L'esperienza è stata eccezionale e lo consiglio a tutti!"</p>
                <p style="margin:0; color:#333333; font-weight:600; font-size:15px;">— Mario Rossi, Cliente Soddisfatto</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
  },
  
  {
    id: 'section-cta',
    name: 'Call-to-Action Box',
    icon: '🚀',
    category: 'layout',
    description: 'Sezione CTA con pulsante prominente',
    html: `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding:50px 20px;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600">
            <tr>
              <td style="text-align:center; color:#ffffff;">
                <h2 style="margin:0 0 15px; font-size:28px; font-weight:bold;">Pronto per Iniziare?</h2>
                <p style="margin:0 0 25px; font-size:16px; opacity:0.95;">Unisciti a migliaia di utenti soddisfatti che hanno già fatto il grande passo.</p>
                <a href="#" style="display:inline-block; background:#ffffff; color:#f5576c; padding:16px 45px; border-radius:50px; text-decoration:none; font-weight:bold; font-size:16px; box-shadow:0 6px 20px rgba(0,0,0,0.15);">
                  Inizia Gratis
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
  },

  // ========== 🧩 ELEMENTI BASE (i tuoi esistenti) ==========
 // ========== 🧩 ELEMENTI BASE (con struttura table) ==========
{
  id: 'header',
  name: 'Header',
  icon: '📋',
  category: 'basic',
  description: 'Intestazione con logo e titolo',
  html: `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600">
          <tr>
            <td style="text-align:center;">
              <h1 style="color:#ffffff; margin:0; font-size:32px; font-weight:bold;">Il Tuo Titolo</h1>
              <p style="color:#ffffff; margin:10px 0 0; font-size:16px; opacity:0.9;">Sottotitolo o descrizione breve</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
},

{
  id: 'image',
  name: 'Immagine',
  icon: '🖼️',
  category: 'basic',
  description: 'Blocco immagine responsive',
  html: `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff; padding:20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600">
          <tr>
            <td style="text-align:center;">
              <img src="https://placehold.co/600x300/667eea/ffffff?text=Immagine" style="max-width:100%; height:auto; border-radius:8px; display:block; margin:0 auto;" alt="Immagine">
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
},

{
  id: 'text',
  name: 'Paragrafo',
  icon: '📝',
  category: 'basic',
  description: 'Testo formattato',
  html: `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff; padding:30px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600">
          <tr>
            <td>
              <h3 style="margin:0 0 15px; color:#333333; font-size:22px; font-weight:600;">Titolo Paragrafo</h3>
              <p style="margin:0; color:#666666; font-size:16px; line-height:1.6;">
                Inserisci il tuo testo qui. Puoi modificarlo liberamente con doppio click. Questo blocco è perfetto per contenuti testuali di media lunghezza.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
},

{
  id: 'button',
  name: 'Pulsante',
  icon: '🔘',
  category: 'basic',
  description: 'Call-to-action button',
  html: `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff; padding:30px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600">
          <tr>
            <td style="text-align:center;">
              <p style="margin:0 0 20px; color:#666666; font-size:15px;">Testo descrittivo prima del pulsante (opzionale)</p>
              <a href="#" style="display:inline-block; background:#667eea; color:#ffffff; padding:15px 40px; text-decoration:none; border-radius:6px; font-weight:bold; font-size:16px;">
                Scopri di più
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
},

{
  id: 'divider',
  name: 'Separatore',
  icon: '➖',
  category: 'basic',
  description: 'Linea divisoria',
  html: `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff; padding:20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600">
          <tr>
            <td>
              <hr style="border:none; border-top:2px solid #e5e7eb; margin:20px 0;">
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
},

{
  id: 'social',
  name: 'Social Media',
  icon: '📱',
  category: 'basic',
  description: 'Link ai social',
  html: `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f8f9fa; padding:30px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600">
          <tr>
            <td style="text-align:center;">
              <p style="margin:0 0 15px; color:#666666; font-size:14px;">Seguici sui social</p>
              <div>
                <a href="#" style="display:inline-block; margin:0 10px; color:#667eea; text-decoration:none; font-weight:600; font-size:15px;">Facebook</a>
                <a href="#" style="display:inline-block; margin:0 10px; color:#667eea; text-decoration:none; font-weight:600; font-size:15px;">Twitter</a>
                <a href="#" style="display:inline-block; margin:0 10px; color:#667eea; text-decoration:none; font-weight:600; font-size:15px;">Instagram</a>
                <a href="#" style="display:inline-block; margin:0 10px; color:#667eea; text-decoration:none; font-weight:600; font-size:15px;">LinkedIn</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
},

{
  id: 'footer',
  name: 'Footer',
  icon: '📄',
  category: 'basic',
  description: 'Piè di pagina con info',
  html: `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#2d3748; padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600">
          <tr>
            <td style="text-align:center;">
              <p style="color:#ffffff; font-size:14px; margin:0 0 10px; font-weight:600;">La Tua Azienda</p>
              <p style="color:#a0aec0; font-size:13px; margin:0 0 15px; line-height:1.5;">
                Via Esempio 123, 20100 Milano (MI)<br>
                info@tuaazienda.com | +39 02 1234567
              </p>
              <p style="color:#718096; font-size:12px; margin:0;">
                © 2025 La Tua Azienda. Tutti i diritti riservati.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
}
];

// Aggiungi questo stato per tracciare la selezione del testo

const [showHTMLEditor, setShowHTMLEditor] = useState(false);

const [textSelection, setTextSelection] = useState({});

    const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);

    const [editingText, setEditingText] = useState("");
    // 🆕 Stati aggiuntivi per editor avanzato
// const [columnStyles, setColumnStyles] = useState({});
const [draggingColumnIndex, setDraggingColumnIndex] = useState(null);

  const [subject, setSubject] = useState("");
  const [emailContent, setEmailContent] = useState("<p></p>");
  const [recipientList, setRecipientList] = useState([]);
  const [isBuilderTemplate, setIsBuilderTemplate] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");  
  const [emailHTML, setEmailHTML] = useState("");  

  // --- TEMPLATE LIBRARY ---
const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
const [templateSearch, setTemplateSearch] = useState("");
const [templateCategory, setTemplateCategory] = useState("all");
const [selectedTemplate, setSelectedTemplate] = useState(null);
// 🆕 Stati per Modal Editor Sezioni
// const [showSectionEditor, setShowSectionEditor] = useState(false);
// const [editingSectionData, setEditingSectionData] = useState(null);
  


  const [isDarkMode, setIsDarkMode] = useState(false);
  
  
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showDraftError, setShowDraftError] = useState(false);
  const [showDraftSuccess, setShowDraftSuccess] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [totalRecipients, setTotalRecipients] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const [showConfirmSend, setShowConfirmSend] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [campaignName, setCampaignName] = useState("");

  const [ccError, setCcError] = useState("");
  const [bccError, setBccError] = useState("");

  const [lastSavedData, setLastSavedData] = useState(null);
  const [lastAutoSave, setLastAutoSave] = useState(null);

  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);



// 🆕 Stati per Button Editor (AGGIUNGI QUESTE RIGHE)
const [editingButton, setEditingButton] = useState(false);
const [buttonText, setButtonText] = useState('');
const [buttonLink, setButtonLink] = useState('');
const [buttonColor, setButtonColor] = useState('#ffa500');
const [buttonTextColor, setButtonTextColor] = useState('#ffffff');
const [openInNewTab, setOpenInNewTab] = useState(true);

// ⚙️ Impostazioni avanzate esportazione
const [showExportSettings, setShowExportSettings] = useState(false);
const [autoExportLog, setAutoExportLog] = useState(() => localStorage.getItem("autoExportLog") === "true");
const [defaultExportFormat, setDefaultExportFormat] = useState(() => localStorage.getItem("defaultExportFormat") || "csv");
const [customExportName, setCustomExportName] = useState(() => localStorage.getItem("customExportName") || "resend_log");
const [sendLogByEmail, setSendLogByEmail] = useState(() => localStorage.getItem("sendLogByEmail") === "true");
const [emailRecipient, setEmailRecipient] = useState(() => localStorage.getItem("emailRecipient") || "");


// 🆕 NUOVI STATI PER GLI STILI AVANZATI
const [buttonAlignment, setButtonAlignment] = useState('center');
const [buttonSize, setButtonSize] = useState('medio');
const [buttonShape, setButtonShape] = useState('rotondo');
const [borderType, setBorderType] = useState('none');
const [borderWidth, setBorderWidth] = useState(0);
const [borderColor, setBorderColor] = useState('#000000');
const [paddingTop, setPaddingTop] = useState(15);
const [paddingBottom, setPaddingBottom] = useState(15);
const [paddingLeft, setPaddingLeft] = useState(40);
const [paddingRight, setPaddingRight] = useState(40);
const [applyPaddingAll, setApplyPaddingAll] = useState(false);

const [savedBlocks, setSavedBlocks] = useState([]);

// 🆕 Stati per Drag & Drop nativo
// 🧩 Stati per drag & drop
const [canvasBlocks, setCanvasBlocks] = useState([]);
const [draggedBlock, setDraggedBlock] = useState(null);
const [isDraggingOver, setIsDraggingOver] = useState(false);
const [ghostBlock, setGhostBlock] = useState(null);
const [ghostPosition, setGhostPosition] = useState({ x: 0, y: 0 });
const [draggingIndex, setDraggingIndex] = useState(null);
// 🧠 Editor contestuale per i blocchi
const [editingBlock, setEditingBlock] = useState(null); // contiene il blocco selezionato
const [editingContent, setEditingContent] = useState(""); // HTML o testo del blocco

// 📧 Modale invio test email
const [showTestEmailModal, setShowTestEmailModal] = useState(false);
const [testEmailAddress, setTestEmailAddress] = useState("");
const [sendingTestEmail, setSendingTestEmail] = useState(false);
const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
// 🧾 Log invii Resend
const [resendLog, setResendLog] = useState([]);
// 🔍 Ricerca e filtro log
const [logSearch, setLogSearch] = useState("");
const [logFilter, setLogFilter] = useState("all"); // all | success | error
// 💾 Impostazione: esportazione automatica log

// ✍️ Inline editing
const [inlineEditing, setInlineEditing] = useState(null); // {index, field, type}
const [inlineValue, setInlineValue] = useState("");
const editorRef = useRef(null);

const templateCategories = ["all", "newsletter", "business", "ecommerce", "events", "welcome", "travel", "food", "education", "holidays"];

const filteredTemplates = useMemo(() => {
  return templates.filter((tpl) => {
    const matchCategory = templateCategory === "all" || tpl.category === templateCategory;
    const matchSearch =
      !templateSearch ||
      tpl.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
      tpl.description.toLowerCase().includes(templateSearch.toLowerCase());
    return matchCategory && matchSearch;
  });
}, [templates, templateCategory, templateSearch]);

const parseCTAContent = () => {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = editingSingleBlock.html;

  return {
    title: wrapper.querySelector("h2")?.textContent || "",
    subtitle: wrapper.querySelector("p")?.textContent || "",
    buttonText: wrapper.querySelector("a")?.textContent || "",
    buttonLink: wrapper.querySelector("a")?.getAttribute("href") || "#",
  };
};

const updateCTAContent = (prop, value) => {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = editingSingleBlock.html;

  const h2 = wrapper.querySelector("h2");
  const p = wrapper.querySelector("p");
  const a = wrapper.querySelector("a");

  if (prop === "title" && h2) h2.textContent = value;
  if (prop === "subtitle" && p) p.textContent = value;
  if (prop === "buttonText" && a) a.textContent = value;
  if (prop === "buttonLink" && a) a.setAttribute("href", value);

  setEditingSingleBlock({
    ...editingSingleBlock,
    html: wrapper.innerHTML
  });
};

// ✨ Toolbar testo fluttuante
const [showTextToolbar, setShowTextToolbar] = useState(false);
const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
const [selectionRange, setSelectionRange] = useState(null);
const [activeColumnEditor, setActiveColumnEditor] = useState(null);
const toolbarRef = useRef(null);
useEffect(() => {
  const handleSelection = () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Mostra la toolbar sopra la selezione
      setShowTextToolbar(true);
      setToolbarPosition({ x: rect.left + rect.width / 2, y: rect.top - 40 });
      setSelectionRange(range);
    } else {
      setShowTextToolbar(false);
    }
  };

 
// 🎨 Cambia il colore di sfondo del blocco (root element)
const updateBlockBackgroundColor = (value) => {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = editingSingleBlock.html;

  const root = wrapper.firstElementChild;
  if (!root) return;

  root.style.backgroundColor = value;

  setEditingSingleBlock({
    ...editingSingleBlock,
    html: wrapper.innerHTML,
    styles: {
      ...editingSingleBlock.styles,
      backgroundColor: value
    }
  });
};

  const handleSocialEdit = (block, index) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(block.html, "text/html");
  
    const icons = [...doc.querySelectorAll("a")].map(a => ({
      html: a.innerHTML,
      href: a.getAttribute("href") || "#"
    }));
  
    setSocialEditor({
      open: true,
      index,
      items: icons
    });
  };
  

  document.addEventListener("mouseup", handleSelection);
  document.addEventListener("keyup", handleSelection);
  return () => {
    document.removeEventListener("mouseup", handleSelection);
    document.removeEventListener("keyup", handleSelection);
  };
}, []);
const applyFormat = (command, value = null) => {
  if (!selectionRange) return;
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(selectionRange);
  document.execCommand(command, false, value);
  setShowTextToolbar(false);
};

// 💾 Salva lo stato dell'editor quando cambia
// useEffect(() => {
//   console.log('💾 Save effect triggered:', { showSectionEditor, editingSectionData: !!editingSectionData });
  
//   if (showSectionEditor && editingSectionData) {
//     const stateToSave = {
//       showSectionEditor: true,
//       editingSectionData,
//       columnStyles,
//       timestamp: Date.now()
//     };
//     console.log('✅ Saving to sessionStorage:', stateToSave);
//     sessionStorage.setItem('emailEditorState', JSON.stringify(stateToSave));
//   } else {
//     console.log('⚠️ Not saving - conditions not met');
//   }
// }, [showSectionEditor, editingSectionData, columnStyles]);

// const hasRestoredRef = useRef(false);
// const isPageLoadRef = useRef(true); // 🆕 Traccia se è il primo caricamento

// useEffect(() => {
//   console.log('🔄 Restore effect: Component mounted');
  
//   const restoreState = () => {
//     // ⚠️ Se abbiamo già ripristinato, non farlo di nuovo
//     if (hasRestoredRef.current) {
//       console.log('⏸️ Già ripristinato in questa sessione');
//       return;
//     }
    
//     // ⚠️ Non ripristinare se l'editor è già aperto
//     if (showSectionEditor) {
//       console.log('⏸️ Editor già aperto, skip restore');
//       console.trace('Stack trace:'); // Mostra da dove viene chiamato
//       return;
//     }
    
//     console.log('🔍 Checking for saved state...');
//     const savedState = sessionStorage.getItem('emailEditorState');
    
//     if (savedState) {
//       try {
//         const parsed = JSON.parse(savedState);
//         console.log('📦 Parsed state:', parsed);
        
//         const oneHour = 60 * 60 * 1000;
//         if (Date.now() - parsed.timestamp < oneHour) {
//           console.log('✅ Restoring state...');
          
//           setIsRestoring(true);
//           setShowSectionEditor(true);
//           setEditingSectionData(parsed.editingSectionData);
//           setColumnStyles(parsed.columnStyles || {});
          
//           hasRestoredRef.current = true;
          
//           setTimeout(() => {
//             setIsRestoring(false);
//             sessionStorage.removeItem('emailEditorState'); // 🔥 Pulisci anche il salvataggio
//           }, 2000);
          
//           // 🔥 Mostra il toast solo se NON è il primo caricamento
//           if (!isPageLoadRef.current) {
//             toast.success('📝 Editor ripristinato', { duration: 2000 });
//           }
//         } else {
//           sessionStorage.removeItem('emailEditorState');
//         }
//       } catch (e) {
//         console.error('❌ Error parsing state:', e);
//         sessionStorage.removeItem('emailEditorState');
//       }
//     }
//   };

//   restoreState();
  
//   // Dopo il primo restore, segna che non è più il primo caricamento
//   setTimeout(() => {
//     isPageLoadRef.current = false;
//   }, 1000);
  
// }, []);

// 🎹 Shortcuts tastiera per la formattazione
useEffect(() => {
  if (!showSectionEditor || activeColumnEditor === null) return;

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
      switch(e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          applyFormatting(activeColumnEditor, 'bold');
          break;
        case 'i':
          e.preventDefault();
          applyFormatting(activeColumnEditor, 'italic');
          break;
        case 'u':
          e.preventDefault();
          applyFormatting(activeColumnEditor, 'underline');
          break;
        case 'k':
          e.preventDefault();
          applyFormatting(activeColumnEditor, 'link');
          break;
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [showSectionEditor, activeColumnEditor]);

useEffect(() => {
  localStorage.setItem("autoExportLog", autoExportLog);
  localStorage.setItem("defaultExportFormat", defaultExportFormat);
  localStorage.setItem("customExportName", customExportName);
  localStorage.setItem("sendLogByEmail", sendLogByEmail);
  localStorage.setItem("emailRecipient", emailRecipient);
}, [autoExportLog, defaultExportFormat, customExportName, sendLogByEmail, emailRecipient]);



const saveCustomBlock = (block) => {
  // Aggiungi il nuovo blocco ai blocchi salvati
  const newSavedBlocks = [...savedBlocks, block];

  // Salva nel localStorage (opzionale)
  localStorage.setItem('savedBlocks', JSON.stringify(newSavedBlocks));

  // Aggiorna lo stato
  setSavedBlocks(newSavedBlocks);
};


  const { 
    saveCampaign, 
    updateCampaignAfterSend, 
    deleteCampaign,
    loadCampaigns,  
    saving: isSavingToDB
  } = useCampaigns();

  const parseTestimonialContent = () => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = editingSingleBlock.html;
  
    return {
      avatar: wrapper.querySelector("div")?.textContent || "👤",
      review: wrapper.querySelector("p:nth-of-type(1)")?.textContent?.replace(/"/g, "") || "",
      author: wrapper.querySelector("p:nth-of-type(2)")?.textContent?.split("—")[1]?.trim() || "",
    };
  };
  
  const updateTestimonialContent = (prop, value) => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = editingSingleBlock.html;
  
    const avatarBox = wrapper.querySelector("div");
    const review = wrapper.querySelector("p:nth-of-type(1)");
    const author = wrapper.querySelector("p:nth-of-type(2)");
  
    if (prop === "avatar" && avatarBox) avatarBox.textContent = value;
    if (prop === "review" && review) review.textContent = `"${value}"`;
    if (prop === "author" && author) author.textContent = `— ${value}`;
  
    setEditingSingleBlock({
      ...editingSingleBlock,
      html: wrapper.innerHTML
    });
  };
  
 // 🎯 Inizio drag da sidebar
const handleDragStart = (block, e) => {
  setDraggedBlock(block);
  setGhostBlock(block);
  setGhostPosition({ x: e.clientX, y: e.clientY });

  const moveGhost = (ev) => setGhostPosition({ x: ev.clientX, y: ev.clientY });
  document.addEventListener("mousemove", moveGhost);

  const cleanup = () => {
    setGhostBlock(null);
    document.removeEventListener("mousemove", moveGhost);
    document.removeEventListener("mouseup", cleanup);
  };
  document.addEventListener("mouseup", cleanup);
};

// 🧩 Pannello laterale di stile contestuale
const [activeStyleBlock, setActiveStyleBlock] = useState(null);
const [styleFields, setStyleFields] = useState({
  fontSize: "16px",
  textAlign: "left",
  color: "#333333",
  backgroundColor: "#ffffff",
  padding: "10px",
  borderRadius: "4px",

  // 🖼 Campi immagine
  imgWidth: "100%",
  imgBorderRadius: "8px",
  imgPadding: "0px",
  imgAlign: "center",
  imgBorderWidth: "0px",
  imgBorderColor: "#000000",
  imgBorderStyle: "none",
  imgShadow: false,
});

const extractImageURL = (html) => {
  const match = html.match(/src="([^"]+)"/);
  return match ? match[1] : "";
};
const updateCTAGradient = (color1, color2) => {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = editingSingleBlock.html;

  const table = wrapper.querySelector("table");
  if (table) {
    table.style.background = `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
  }

  setEditingSingleBlock({
    ...editingSingleBlock,
    html: wrapper.innerHTML
  });
};
const updateCTAColor = (prop, value) => {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = editingSingleBlock.html;

  const h2 = wrapper.querySelector("h2");
  const p = wrapper.querySelector("p");
  const a = wrapper.querySelector("a");

  if (prop === "titleColor" && h2) h2.style.color = value;
  if (prop === "subtitleColor" && p) p.style.color = value;
  if (prop === "buttonTextColor" && a) a.style.color = value;

  setEditingSingleBlock({
    ...editingSingleBlock,
    html: wrapper.innerHTML
  });
};
const updateCTAButtonStyle = (prop, value) => {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = editingSingleBlock.html;

  const a = wrapper.querySelector("a");
  if (!a) return;

  if (prop === "bg") a.style.background = value;
  if (prop === "radius") a.style.borderRadius = value + "px";
  if (prop === "padding") a.style.padding = value;
  if (prop === "shadow") {
    a.style.boxShadow = value 
      ? "0 6px 20px rgba(0,0,0,0.15)"
      : "none";
  }

  setEditingSingleBlock({
    ...editingSingleBlock,
    html: wrapper.innerHTML
  });
};
const updateCTAFontSize = (prop, value) => {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = editingSingleBlock.html;

  const h2 = wrapper.querySelector("h2");
  const p = wrapper.querySelector("p");
  const a = wrapper.querySelector("a");

  if (prop === "title" && h2) h2.style.fontSize = value + "px";
  if (prop === "subtitle" && p) p.style.fontSize = value + "px";
  if (prop === "button" && a) a.style.fontSize = value + "px";

  setEditingSingleBlock({
    ...editingSingleBlock,
    html: wrapper.innerHTML
  });
};
const updateCTAGradientAdvanced = ({ angle, color1, color2 }) => {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = editingSingleBlock.html;

  const table = wrapper.querySelector("table");

  if (table) {
    table.style.background = `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`;
  }

  setEditingSingleBlock({ ...editingSingleBlock, html: wrapper.innerHTML });
};

// 🔧 Estrae il contenuto delle colonne da una sezione HTML
// 🔧 Estrae il contenuto E gli stili delle colonne
const extractColumnsFromSection = (html) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const cells = doc.querySelectorAll('td[style*="padding"]');
  
  const columns = [];
  const styles = {};
  
  cells.forEach((cell, idx) => {
    const content = cell.innerHTML.trim();
    if (content && !content.includes('<table')) {
      columns.push(content);
      
      // Estrai stili esistenti
      const style = cell.getAttribute('style') || '';
      const bgMatch = style.match(/background(?:-color)?:\s*([^;]+)/);
      const colorMatch = content.match(/color:\s*([^;"]+)/);
      
      styles[idx] = {
        backgroundColor: bgMatch ? bgMatch[1].trim() : '#ffffff',
        textColor: colorMatch ? colorMatch[1].trim() : '#333333',
      };
    }
  });
  
  return { 
    columns: columns.length > 0 ? columns : ['<p>Contenuto colonna</p>'],
    styles: styles
  };
};

// 1. Prima crea i template predefiniti (metti questo all'inizio del componente o in un file separato)
const predefinedTemplates = [
  {
    id: 'newsletter-modern',
    name: 'Newsletter Moderna',
    category: 'Newsletter',
    preview: '/templates/newsletter-modern.png', // Oppure usa un placeholder
    description: 'Design pulito e moderno perfetto per newsletter aziendali',
    color: '#3b82f6',
    html: `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f4f4f4; padding:40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background:#ffffff; border-radius:8px;">
              <tr>
                <td style="padding:40px; text-align:center; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                  <h1 style="color:#ffffff; margin:0; font-size:32px; font-weight:bold;">La Tua Newsletter</h1>
                  <p style="color:#ffffff; margin:10px 0 0; font-size:16px; opacity:0.9;">Resta aggiornato con le ultime novità</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;">
                  <h2 style="color:#333333; margin:0 0 20px; font-size:24px;">Titolo Principale</h2>
                  <p style="color:#666666; line-height:1.6; margin:0 0 20px;">Inserisci qui il contenuto della tua newsletter. Questo template è perfetto per comunicazioni aziendali professionali.</p>
                  <a href="#" style="display:inline-block; background:#667eea; color:#ffffff; padding:12px 30px; text-decoration:none; border-radius:6px; font-weight:600;">Scopri di più</a>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 40px; text-align:center; background:#f8f9fa; border-top:1px solid #e9ecef;">
                  <p style="color:#6c757d; margin:0; font-size:12px;">© 2025 La Tua Azienda. Tutti i diritti riservati.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'promo-sales',
    name: 'Promozione Vendite',
    category: 'Promo',
    preview: '/templates/promo-sales.png',
    description: 'Template accattivante per promozioni e offerte speciali',
    color: '#ef4444',
    html: `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#fff5f5; padding:40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding:60px 40px; text-align:center; background:linear-gradient(135deg, #f43f5e 0%, #dc2626 100%);">
                  <div style="background:#ffffff; color:#dc2626; display:inline-block; padding:8px 20px; border-radius:20px; font-size:14px; font-weight:bold; margin-bottom:20px;">🔥 OFFERTA LIMITATA</div>
                  <h1 style="color:#ffffff; margin:20px 0; font-size:42px; font-weight:bold;">SCONTO 50%</h1>
                  <p style="color:#ffffff; margin:0; font-size:18px; opacity:0.95;">Solo per i primi 100 clienti!</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;">
                  <h2 style="color:#333333; margin:0 0 20px; font-size:26px; text-align:center;">Non perdere questa occasione</h2>
                  <p style="color:#666666; line-height:1.6; margin:0 0 30px; text-align:center;">Approfitta subito della nostra super offerta. Valida solo fino a esaurimento scorte!</p>
                  <div style="text-align:center;">
                    <a href="#" style="display:inline-block; background:#dc2626; color:#ffffff; padding:16px 40px; text-decoration:none; border-radius:8px; font-weight:700; font-size:18px;">ACQUISTA ORA</a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'event-invitation',
    name: 'Invito Evento',
    category: 'Eventi',
    preview: '/templates/event-invitation.png',
    description: 'Invita i tuoi contatti a eventi e webinar',
    color: '#8b5cf6',
    html: `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#faf5ff; padding:40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background:#ffffff; border-radius:12px; overflow:hidden;">
              <tr>
                <td style="padding:50px 40px; text-align:center; background:linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);">
                  <div style="font-size:48px; margin-bottom:20px;">🎉</div>
                  <h1 style="color:#ffffff; margin:0 0 10px; font-size:32px; font-weight:bold;">Sei Invitato!</h1>
                  <p style="color:#ffffff; margin:0; font-size:18px; opacity:0.95;">Al nostro prossimo evento esclusivo</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;">
                  <div style="background:#faf5ff; border-left:4px solid #8b5cf6; padding:20px; margin-bottom:30px;">
                    <p style="margin:0; color:#333333;"><strong>📅 Data:</strong> 15 Marzo 2025</p>
                    <p style="margin:10px 0 0; color:#333333;"><strong>🕐 Ora:</strong> 18:00 - 20:00</p>
                    <p style="margin:10px 0 0; color:#333333;"><strong>📍 Luogo:</strong> Online (Zoom)</p>
                  </div>
                  <p style="color:#666666; line-height:1.6; margin:0 0 30px;">Unisciti a noi per una serata all'insegna dell'innovazione e del networking. Non perdere questa opportunità unica!</p>
                  <div style="text-align:center;">
                    <a href="#" style="display:inline-block; background:#8b5cf6; color:#ffffff; padding:14px 35px; text-decoration:none; border-radius:8px; font-weight:600; font-size:16px;">CONFERMA PARTECIPAZIONE</a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'welcome-email',
    name: 'Email di Benvenuto',
    category: 'Onboarding',
    preview: '/templates/welcome.png',
    description: 'Dai il benvenuto ai nuovi iscritti',
    color: '#10b981',
    html: `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ecfdf5; padding:40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background:#ffffff; border-radius:12px;">
              <tr>
                <td style="padding:50px 40px; text-align:center;">
                  <div style="font-size:64px; margin-bottom:20px;">👋</div>
                  <h1 style="color:#059669; margin:0 0 15px; font-size:36px; font-weight:bold;">Benvenuto!</h1>
                  <p style="color:#666666; margin:0; font-size:18px; line-height:1.6;">Siamo felici di averti con noi</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 40px 40px;">
                  <p style="color:#666666; line-height:1.6; margin:0 0 20px;">Ciao! Grazie per esserti iscritto. Ecco cosa puoi fare per iniziare:</p>
                  <div style="background:#f0fdf4; border-radius:8px; padding:20px; margin-bottom:15px;">
                    <p style="margin:0; color:#333333;"><strong>✓</strong> Completa il tuo profilo</p>
                  </div>
                  <div style="background:#f0fdf4; border-radius:8px; padding:20px; margin-bottom:15px;">
                    <p style="margin:0; color:#333333;"><strong>✓</strong> Esplora le funzionalità</p>
                  </div>
                  <div style="background:#f0fdf4; border-radius:8px; padding:20px; margin-bottom:30px;">
                    <p style="margin:0; color:#333333;"><strong>✓</strong> Contattaci per supporto</p>
                  </div>
                  <div style="text-align:center;">
                    <a href="#" style="display:inline-block; background:#10b981; color:#ffffff; padding:14px 35px; text-decoration:none; border-radius:8px; font-weight:600;">INIZIA ORA</a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'minimal-announcement',
    name: 'Annuncio Minimal',
    category: 'Comunicazione',
    preview: '/templates/minimal.png',
    description: 'Design minimalista per comunicazioni importanti',
    color: '#64748b',
    html: `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f8fafc; padding:60px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background:#ffffff;">
              <tr>
                <td style="padding:60px; border-top:4px solid #0f172a;">
                  <h1 style="color:#0f172a; margin:0 0 30px; font-size:32px; font-weight:700; letter-spacing:-0.5px;">Importante Aggiornamento</h1>
                  <p style="color:#475569; line-height:1.8; margin:0 0 20px; font-size:16px;">Caro cliente,</p>
                  <p style="color:#475569; line-height:1.8; margin:0 0 20px; font-size:16px;">Desideriamo informarti di un importante aggiornamento che riguarda i nostri servizi. Questo cambiamento migliorerà significativamente la tua esperienza.</p>
                  <p style="color:#475569; line-height:1.8; margin:0 0 30px; font-size:16px;">Per maggiori dettagli, consulta la nostra guida completa.</p>
                  <a href="#" style="display:inline-block; background:#0f172a; color:#ffffff; padding:12px 28px; text-decoration:none; font-weight:600; letter-spacing:0.5px;">LEGGI DI PIÙ</a>
                  <p style="color:#94a3b8; margin:40px 0 0; font-size:14px; border-top:1px solid #e2e8f0; padding-top:30px;">Cordiali saluti,<br><strong style="color:#475569;">Il Team</strong></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'product-launch',
    name: 'Lancio Prodotto',
    category: 'Prodotti',
    preview: '/templates/product.png',
    description: 'Presenta i tuoi nuovi prodotti in grande stile',
    color: '#f59e0b',
    html: `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#fffbeb; padding:40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background:#ffffff; border-radius:12px; overflow:hidden;">
              <tr>
                <td style="padding:40px; text-align:center; background:linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);">
                  <div style="background:#ffffff; color:#f59e0b; display:inline-block; padding:6px 16px; border-radius:20px; font-size:12px; font-weight:bold; margin-bottom:20px; text-transform:uppercase;">🚀 Nuovo</div>
                  <h1 style="color:#ffffff; margin:0 0 15px; font-size:38px; font-weight:bold;">Presentazione Prodotto</h1>
                  <p style="color:#ffffff; margin:0; font-size:17px; opacity:0.95;">Il futuro è qui</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px; text-align:center;">
                  <div style="background:#fef3c7; border-radius:12px; padding:40px; margin-bottom:30px;">
                    <div style="font-size:72px; margin-bottom:20px;">📦</div>
                    <h2 style="color:#92400e; margin:0; font-size:24px; font-weight:bold;">Nome Prodotto</h2>
                  </div>
                  <p style="color:#666666; line-height:1.6; margin:0 0 30px; font-size:16px;">Scopri il nostro ultimo prodotto che rivoluzionerà il tuo modo di lavorare. Caratteristiche innovative, design elegante, prestazioni eccezionali.</p>
                  <a href="#" style="display:inline-block; background:#f59e0b; color:#ffffff; padding:16px 40px; text-decoration:none; border-radius:8px; font-weight:700; font-size:16px;">SCOPRI ORA</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'birthday-celebration',
    name: 'Auguri Compleanno',
    category: 'Celebrazioni',
    preview: '/templates/birthday.png',
    description: 'Celebra i compleanni dei tuoi clienti con stile',
    color: '#ec4899',
    html: `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#fdf2f8; padding:40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background:#ffffff; border-radius:16px; overflow:hidden;">
              <tr>
                <td style="padding:50px 40px; text-align:center; background:linear-gradient(135deg, #f472b6 0%, #ec4899 100%);">
                  <div style="font-size:64px; margin-bottom:20px;">🎂</div>
                  <h1 style="color:#ffffff; margin:0 0 10px; font-size:36px; font-weight:bold;">Buon Compleanno!</h1>
                  <p style="color:#ffffff; margin:0; font-size:18px; opacity:0.95;">È il tuo giorno speciale</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px; text-align:center;">
                  <p style="color:#666666; line-height:1.6; margin:0 0 30px; font-size:18px;">🎉 Vogliamo celebrare questo giorno speciale con te! Abbiamo preparato un regalo esclusivo solo per te.</p>
                  <div style="background:#fdf2f8; border-radius:12px; padding:30px; margin-bottom:30px;">
                    <h2 style="color:#ec4899; margin:0 0 10px; font-size:28px; font-weight:bold;">20% DI SCONTO</h2>
                    <p style="color:#666666; margin:0; font-size:14px;">Usa il codice: <strong style="color:#ec4899; font-size:18px;">BIRTHDAY2025</strong></p>
                  </div>
                  <a href="#" style="display:inline-block; background:#ec4899; color:#ffffff; padding:16px 40px; text-decoration:none; border-radius:8px; font-weight:700; font-size:16px;">RISCATTA IL TUO REGALO</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'thank-you',
    name: 'Ringraziamento',
    category: 'Comunicazione',
    preview: '/templates/thanks.png',
    description: 'Ringrazia i tuoi clienti con eleganza',
    color: '#06b6d4',
    html: `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ecfeff; padding:40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background:#ffffff; border-radius:12px;">
              <tr>
                <td style="padding:50px 40px; text-align:center;">
                  <div style="font-size:72px; margin-bottom:20px;">💙</div>
                  <h1 style="color:#0891b2; margin:0 0 20px; font-size:40px; font-weight:bold;">Grazie!</h1>
                  <p style="color:#666666; line-height:1.8; margin:0; font-size:18px;">La tua fiducia è il nostro successo</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 40px 40px;">
                  <p style="color:#666666; line-height:1.6; margin:0 0 25px; font-size:16px;">Desideriamo ringraziarti per aver scelto i nostri servizi. Il tuo supporto significa molto per noi e ci spinge a fare sempre meglio.</p>
                  <div style="background:#cffafe; border-radius:8px; padding:25px; text-align:center; margin-bottom:30px;">
                    <p style="margin:0; color:#0e7490; font-size:16px; line-height:1.6;">⭐ Se hai apprezzato il nostro servizio,<br>ci farebbe piacere ricevere una tua recensione!</p>
                  </div>
                  <div style="text-align:center;">
                    <a href="#" style="display:inline-block; background:#06b6d4; color:#ffffff; padding:14px 35px; text-decoration:none; border-radius:8px; font-weight:600;">LASCIA UNA RECENSIONE</a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'survey-feedback',
    name: 'Sondaggio',
    category: 'Feedback',
    preview: '/templates/survey.png',
    description: 'Raccogli feedback dai tuoi clienti',
    color: '#7c3aed',
    html: `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f5f3ff; padding:40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background:#ffffff; border-radius:12px;">
              <tr>
                <td style="padding:40px; text-align:center; background:linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%);">
                  <div style="font-size:56px; margin-bottom:15px;">📊</div>
                  <h1 style="color:#ffffff; margin:0 0 10px; font-size:32px; font-weight:bold;">La Tua Opinione Conta</h1>
                  <p style="color:#ffffff; margin:0; font-size:16px; opacity:0.95;">Aiutaci a migliorare i nostri servizi</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;">
                  <p style="color:#666666; line-height:1.6; margin:0 0 30px; font-size:16px; text-align:center;">Ci vogliono solo 2 minuti! Il tuo feedback è prezioso per offrire un'esperienza sempre migliore.</p>
                  <div style="background:#f5f3ff; border-radius:8px; padding:25px; margin-bottom:25px;">
                    <p style="margin:0 0 15px; color:#333333; font-weight:600;">Cosa valuterai:</p>
                    <p style="margin:0 0 8px; color:#666666;">✓ Qualità del prodotto/servizio</p>
                    <p style="margin:0 0 8px; color:#666666;">✓ Facilità d'uso</p>
                    <p style="margin:0; color:#666666;">✓ Supporto clienti</p>
                  </div>
                  <div style="text-align:center;">
                    <a href="#" style="display:inline-block; background:#7c3aed; color:#ffffff; padding:16px 40px; text-decoration:none; border-radius:8px; font-weight:700; font-size:16px;">INIZIA IL SONDAGGIO</a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'cart-abandonment',
    name: 'Carrello Abbandonato',
    category: 'E-commerce',
    preview: '/templates/cart.png',
    description: 'Recupera i carrelli abbandonati',
    color: '#f97316',
    html: `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#fff7ed; padding:40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background:#ffffff; border-radius:12px; overflow:hidden;">
              <tr>
                <td style="padding:40px; text-align:center;">
                  <div style="font-size:64px; margin-bottom:20px;">🛒</div>
                  <h1 style="color:#ea580c; margin:0 0 15px; font-size:32px; font-weight:bold;">Hai dimenticato qualcosa?</h1>
                  <p style="color:#666666; margin:0; font-size:16px;">I tuoi prodotti ti stanno aspettando</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 40px 40px;">
                  <div style="background:#fff7ed; border-radius:8px; padding:30px; margin-bottom:25px;">
                    <h3 style="margin:0 0 20px; color:#333333; font-size:18px;">Nel tuo carrello:</h3>
                    <div style="border-bottom:1px solid #fed7aa; padding-bottom:15px; margin-bottom:15px;">
                      <p style="margin:0; color:#666666;">🔹 Prodotto 1 - €49.99</p>
                    </div>
                    <div style="border-bottom:1px solid #fed7aa; padding-bottom:15px; margin-bottom:15px;">
                      <p style="margin:0; color:#666666;">🔹 Prodotto 2 - €29.99</p>
                    </div>
                    <p style="margin:15px 0 0; color:#ea580c; font-size:20px; font-weight:bold;">Totale: €79.98</p>
                  </div>
                  <div style="background:#ffedd5; border-radius:8px; padding:20px; margin-bottom:25px; text-align:center;">
                    <p style="margin:0; color:#9a3412; font-size:14px; font-weight:600;">⏰ OFFERTA SPECIALE: Completa l'ordine ora e ottieni la spedizione gratuita!</p>
                  </div>
                  <div style="text-align:center;">
                    <a href="#" style="display:inline-block; background:#f97316; color:#ffffff; padding:16px 40px; text-decoration:none; border-radius:8px; font-weight:700; font-size:16px;">COMPLETA L'ACQUISTO</a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'seasonal-christmas',
    name: 'Natale',
    category: 'Stagionale',
    preview: '/templates/christmas.png',
    description: 'Template festivo per le tue campagne natalizie',
    color: '#dc2626',
    html: `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#fee2e2; padding:40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background:#ffffff; border-radius:12px; overflow:hidden; border:3px solid #dc2626;">
              <tr>
                <td style="padding:50px 40px; text-align:center; background:linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                  <div style="font-size:64px; margin-bottom:20px;">🎄</div>
                  <h1 style="color:#ffffff; margin:0 0 10px; font-size:36px; font-weight:bold;">Buon Natale!</h1>
                  <p style="color:#ffffff; margin:0; font-size:18px; opacity:0.95;">I nostri migliori auguri per te</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px; text-align:center;">
                  <p style="color:#666666; line-height:1.6; margin:0 0 30px; font-size:16px;">🎁 Celebra le feste con la nostra offerta natalizia esclusiva!</p>
                  <div style="background:#fef2f2; border:2px dashed #dc2626; border-radius:12px; padding:30px; margin-bottom:30px;">
                    <h2 style="color:#dc2626; margin:0 0 10px; font-size:32px; font-weight:bold;">30% OFF</h2>
                    <p style="color:#666666; margin:0; font-size:14px;">Su tutti i prodotti</p>
                    <p style="color:#991b1b; margin:10px 0 0; font-size:12px; font-weight:600;">Valido fino al 31 Dicembre</p>
                  </div>
                  <a href="#" style="display:inline-block; background:#dc2626; color:#ffffff; padding:16px 40px; text-decoration:none; border-radius:8px; font-weight:700; font-size:16px;">ACQUISTA ORA</a>
                  <p style="color:#666666; margin:30px 0 0; font-size:14px;">🎅 Spedizione gratuita per ordini superiori a €50</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
  },
  {
    id: 'webinar-reminder',
    name: 'Promemoria Webinar',
    category: 'Eventi',
    preview: '/templates/webinar.png',
    description: 'Ricorda ai partecipanti il tuo webinar',
    color: '#0891b2',
    html: `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#cffafe; padding:40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background:#ffffff; border-radius:12px;">
              <tr>
                <td style="padding:40px; text-align:center; background:linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);">
                  <div style="font-size:56px; margin-bottom:20px;">🎥</div>
                  <h1 style="color:#ffffff; margin:0 0 10px; font-size:32px; font-weight:bold;">Il Webinar Inizia Presto!</h1>
                  <p style="color:#ffffff; margin:0; font-size:16px; opacity:0.95;">Non dimenticare di partecipare</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;">
                  <div style="background:#ecfeff; border-left:4px solid #0891b2; padding:25px; margin-bottom:30px;">
                    <h3 style="margin:0 0 15px; color:#0e7490; font-size:20px;">📌 Dettagli del Webinar</h3>
                    <p style="margin:0 0 10px; color:#333333;"><strong>Titolo:</strong> Come Crescere il Tuo Business Online</p>
                    <p style="margin:0 0 10px; color:#333333;"><strong>Data:</strong> Domani, 15 Marzo 2025</p>
                    <p style="margin:0 0 10px; color:#333333;"><strong>Ora:</strong> 15:00 - 16:30</p>
                    <p style="margin:0; color:#333333;"><strong>Piattaforma:</strong> Zoom</p>
                  </div>
                  <div style="background:#fef3c7; border-radius:8px; padding:20px; margin-bottom:30px; text-align:center;">
                    <p style="margin:0; color:#92400e; font-size:14px; font-weight:600;">⏰ Mancano solo 24 ore! Salva la data nel tuo calendario</p>
                  </div>
                  <div style="text-align:center;">
                    <a href="#" style="display:inline-block; background:#0891b2; color:#ffffff; padding:16px 40px; text-decoration:none; border-radius:8px; font-weight:700; font-size:16px; margin-bottom:15px;">AGGIUNGI AL CALENDARIO</a>
                    <br>
                    <a href="#" style="display:inline-block; background:transparent; color:#0891b2; padding:12px 30px; text-decoration:none; border:2px solid #0891b2; border-radius:8px; font-weight:600; font-size:14px;">OTTIENI IL LINK ZOOM</a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
  }
];

const [showLinkModal, setShowLinkModal] = useState(false);
const [showColorPicker, setShowColorPicker] = useState(false);
const [showHighlightPicker, setShowHighlightPicker] = useState(false);
const [linkUrl, setLinkUrl] = useState('');
const [selectedColor, setSelectedColor] = useState('#000000');
const [selectedHighlight, setSelectedHighlight] = useState('#ffff00');

// 🔧 Ricostruisce l'HTML con nuove colonne E stili
const rebuildSectionHTML = (originalHTML, newColumns, columnStyles = {}) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(originalHTML, 'text/html');
  
  const cells = doc.querySelectorAll('td[style*="padding"]');
  
  let columnIndex = 0;
  cells.forEach((cell) => {
    const content = cell.innerHTML.trim();
    if (content && !content.includes('<table') && columnIndex < newColumns.length) {
      // Applica nuovo contenuto
      cell.innerHTML = newColumns[columnIndex];
      
      // Applica nuovi stili se presenti
      if (columnStyles[columnIndex]) {
        const currentStyle = cell.getAttribute('style') || '';
        let newStyle = currentStyle;
        
        // Aggiorna background-color
        if (columnStyles[columnIndex].backgroundColor) {
          if (newStyle.includes('background')) {
            newStyle = newStyle.replace(
              /background(?:-color)?:\s*[^;]+/,
              `background-color: ${columnStyles[columnIndex].backgroundColor}`
            );
          } else {
            newStyle += `; background-color: ${columnStyles[columnIndex].backgroundColor}`;
          }
        }
        
        cell.setAttribute('style', newStyle);
        
        // Applica colore testo agli elementi interni
        if (columnStyles[columnIndex].textColor) {
          const innerElements = cell.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span');
          innerElements.forEach(el => {
            const elStyle = el.getAttribute('style') || '';
            if (elStyle.includes('color:')) {
              el.setAttribute('style', elStyle.replace(/color:\s*[^;]+/, `color: ${columnStyles[columnIndex].textColor}`));
            } else {
              el.setAttribute('style', `${elStyle}; color: ${columnStyles[columnIndex].textColor}`);
            }
          });
        }
      }
      
      columnIndex++;
    }
  });
  
  return doc.body.innerHTML;
};

// 🔧 Riordina le colonne (drag & drop)
const reorderColumns = (columns, fromIndex, toIndex) => {
  const newColumns = [...columns];
  const [movedColumn] = newColumns.splice(fromIndex, 1);
  newColumns.splice(toIndex, 0, movedColumn);
  return newColumns;
};
// 🎨 Live Preview in tempo reale per il blocco attivo
useEffect(() => {
  if (!activeStyleBlock) return;

  const updated = [...canvasBlocks];
  const blockIndex = activeStyleBlock.index;
  if (blockIndex === undefined || !updated[blockIndex]) return;

  const block = updated[blockIndex];

  // ---------------------------------------------------------
  // 🟦 1) SE È UN BLOCCO TESTUALE — NON SOVRASCRIVERE IL TESTO
  // ---------------------------------------------------------
  if (activeStyleBlock.id !== "image") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(block.html, "text/html");

    const el = doc.body.firstElementChild;
    if (!el) return;

    el.style.fontSize = styleFields.fontSize;
    el.style.textAlign = styleFields.textAlign;
    el.style.color = styleFields.color;
    el.style.backgroundColor = styleFields.backgroundColor;
    el.style.padding = styleFields.padding;
    el.style.borderRadius = styleFields.borderRadius;

    updated[blockIndex].html = doc.body.innerHTML;
    setCanvasBlocks(updated);
    return;
  }

  // ---------------------------------------------------------
  // 🟩 2) SE È UN BLOCCO IMMAGINE — APPLICA SOLO STILI IMMAGINE
  // ---------------------------------------------------------
  if (activeStyleBlock.id === "image") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(block.html, "text/html");

    const img = doc.querySelector("img");
    if (!img) return;

    img.style.width = styleFields.imgWidth;
    img.style.borderRadius = styleFields.imgBorderRadius;
    img.style.padding = styleFields.imgPadding;
    img.style.border = `${styleFields.imgBorderWidth} ${styleFields.imgBorderStyle} ${styleFields.imgBorderColor}`;
    img.style.boxShadow = styleFields.imgShadow
      ? "0 4px 12px rgba(0,0,0,0.2)"
      : "none";

    img.style.display = "block";
    img.style.margin =
      styleFields.imgAlign === "center"
        ? "0 auto"
        : styleFields.imgAlign === "left"
        ? "0 auto 0 0"
        : "0 0 0 auto";

    updated[blockIndex].html = doc.body.innerHTML;
    setCanvasBlocks(updated);
  }
}, [styleFields]);



useEffect(() => {
  if (!activeStyleBlock) {
    setInlineEditing(null);
  }
}, [activeStyleBlock]);

// Aggiungi questa funzione nel tuo componente EmailPlatform, prima del return

// Funzione CORRETTA per applicare la formattazione
const applyFormatting = (columnIndex, type, value = null) => {
  const editableDiv = document.querySelector(`div[contentEditable][data-column="${columnIndex}"]`);
  if (!editableDiv) {
    console.error('Div contentEditable non trovato');
    return;
  }

  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const selectedText = range.toString();

  // Se non c'è testo selezionato per alcuni tipi
  if (!selectedText && !['heading', 'fontSize', 'align', 'list-ul', 'list-ol', 'image'].includes(type)) {
    toast.error('Seleziona del testo prima di formattare!', { duration: 2000 });
    return;
  }

  const textColor = columnStyles[columnIndex]?.textColor || '#333333';

  switch (type) {
    case 'bold':
      if (selectedText) {
        document.execCommand('bold', false, null);
      }
      break;

    case 'italic':
      if (selectedText) {
        document.execCommand('italic', false, null);
      }
      break;

    case 'underline':
      if (selectedText) {
        document.execCommand('underline', false, null);
      }
      break;

    case 'strikethrough':
      if (selectedText) {
        document.execCommand('strikeThrough', false, null);
      }
      break;

    case 'textColor':
      if (value) {
        document.execCommand('foreColor', false, value);
      }
      break;

    case 'heading':
      const headingTag = value || 'h3';
      const headingSizes = { h1: '32px', h2: '28px', h3: '24px', h4: '20px', p: '16px' };
      const fontSize = headingSizes[headingTag] || '24px';
      
      document.execCommand('formatBlock', false, headingTag);
      
      setTimeout(() => {
        const headingElement = selection.anchorNode.parentElement;
        if (headingElement && headingElement.tagName.toLowerCase() === headingTag) {
          headingElement.style.margin = headingTag === 'p' ? '0' : '0 0 10px 0';
          headingElement.style.color = textColor;
          headingElement.style.fontSize = fontSize;
          if (headingTag !== 'p') {
            headingElement.style.fontWeight = 'bold';
          }
        }
      }, 10);
      break;

      case 'fontSize':
        const size = value;
        const selection = window.getSelection();
        
        if (selection.toString()) {
          // C'è testo selezionato - applica solo a quello
          const range = selection.getRangeAt(0);
          const selectedText = range.toString();
          
          const span = document.createElement('span');
          span.style.fontSize = `${size}px`;
          
          range.deleteContents();
          span.textContent = selectedText;
          range.insertNode(span);
          
          // Sposta il cursore dopo lo span
          range.setStartAfter(span);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          // Nessun testo selezionato - applica a tutto il contenuto
          const allText = editableDiv.innerHTML;
          editableDiv.innerHTML = `<span style="font-size: ${size}px;">${allText}</span>`;
        }
        break;

    case 'align':
      const alignment = value || 'left';
      const alignCommands = {
        left: 'justifyLeft',
        center: 'justifyCenter',
        right: 'justifyRight',
        justify: 'justifyFull'
      };
      document.execCommand(alignCommands[alignment], false, null);
      break;

      case 'list-ul':
        editableDiv.focus();
        
        // Applica il comando
        document.execCommand('insertUnorderedList', false, null);
        
        // Forza gli stili per renderla visibile
        setTimeout(() => {
          const ul = editableDiv.querySelector('ul');
          if (ul) {
            ul.style.listStyleType = 'disc';
            ul.style.listStylePosition = 'outside';
            ul.style.margin = '10px 0';
            ul.style.paddingLeft = '30px';
            ul.style.color = textColor;
            ul.style.display = 'block';
            
            // Stila ogni <li>
            const lis = ul.querySelectorAll('li');
            lis.forEach(li => {
              li.style.display = 'list-item';
              li.style.listStyleType = 'disc';
              li.style.listStylePosition = 'outside';
              li.style.margin = '5px 0';
              li.style.marginLeft = '0';
              li.style.paddingLeft = '5px';
              li.style.color = textColor;
            });
          }
        }, 100);
        break;
      
      case 'list-ol':
        editableDiv.focus();
        
        // Applica il comando
        document.execCommand('insertOrderedList', false, null);
        
        // Forza gli stili per renderla visibile
        setTimeout(() => {
          const ol = editableDiv.querySelector('ol');
          if (ol) {
            ol.style.listStyleType = 'decimal';
            ol.style.listStylePosition = 'outside';
            ol.style.margin = '10px 0';
            ol.style.paddingLeft = '30px';
            ol.style.color = textColor;
            ol.style.display = 'block';
            
            // Stila ogni <li>
            const lis = ol.querySelectorAll('li');
            lis.forEach(li => {
              li.style.display = 'list-item';
              li.style.listStyleType = 'decimal';
              li.style.listStylePosition = 'outside';
              li.style.margin = '5px 0';
              li.style.marginLeft = '0';
              li.style.paddingLeft = '5px';
              li.style.color = textColor;
            });
          }
        }, 100);
        break;

    case 'link':
      if (selectedText) {
        const url = prompt('Inserisci URL:', 'https://');
        if (url) {
          document.execCommand('createLink', false, url);
          setTimeout(() => {
            const link = selection.anchorNode.parentElement;
            if (link && link.tagName === 'A') {
              link.style.color = '#3b82f6';
              link.style.textDecoration = 'underline';
            }
          }, 10);
        }
      }
      break;

    case 'image':
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const img = document.createElement('img');
            img.src = reader.result;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.display = 'block';
            img.style.margin = '10px 0';
            img.style.borderRadius = '8px';
            
            // Inserisci l'immagine alla posizione del cursore
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.insertNode(img);
              
              // Sposta il cursore dopo l'immagine
              range.setStartAfter(img);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            }
            
            // Aggiorna lo stato
            const newCols = [...editingSectionData.columns];
            newCols[columnIndex] = editableDiv.innerHTML;
            setEditingSectionData({ ...editingSectionData, columns: newCols });
            
            toast.success("🖼️ Immagine inserita!", { duration: 2000 });
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
      break;

    default:
      break;
  }

  // Aggiorna lo stato con il nuovo HTML
  setTimeout(() => {
    const newCols = [...editingSectionData.columns];
    newCols[columnIndex] = editableDiv.innerHTML;
    setEditingSectionData({ ...editingSectionData, columns: newCols });
  }, 100);

  const messages = {
    bold: '✨ Grassetto applicato',
    italic: '✨ Corsivo applicato',
    underline: '✨ Sottolineato applicato',
    strikethrough: '✨ Barrato applicato',
    heading: value ? `✨ ${value.toUpperCase()} applicato` : '✨ Heading applicato',
    fontSize: value ? `✨ Dimensione ${value}px` : '✨ Dimensione modificata',
    align: value ? `✨ Allineamento ${value}` : '✨ Allineamento modificato',
    textColor: '✨ Colore testo applicato',
    'list-ul': '✨ Lista puntata',
    'list-ol': '✨ Lista numerata',
    link: '✨ Link inserito',
    image: '✨ Immagine inserita'
  };

  if (type !== 'image') {
    toast.success(messages[type] || '✨ Formattazione applicata', { duration: 1500 });
  }
};
 // 🟩 Quando il blocco passa sopra l’area drop
const handleDragOver = (e) => {
  e.preventDefault();
  setIsDraggingOver(true);
};

// 🔻 Quando esce dall’area drop
const handleDragLeave = () => {
  setIsDraggingOver(false);
};
// 🟢 Quando il blocco viene rilasciato nel canvas
const handleDrop = (e) => {
  e.preventDefault();
  console.log('📦 DROP EVENT');
  setIsDraggingOver(false);

  if (draggedBlock) {
    console.log('📦 Dropping block:', draggedBlock.name);
    console.log('📦 Block object:', draggedBlock);
    console.log('📦 Block ID:', draggedBlock.id);
    
    const newBlock = { 
      ...draggedBlock, 
      instanceId: `${draggedBlock.id}-${Date.now()}` 
    };
    
    setCanvasBlocks((prev) => {
      const updatedBlocks = [...prev, newBlock];
      
      // ✅ Se è un blocco BASE, apri automaticamente l'editor modale
      const basicBlockIds = ['header', 'footer', 'image', 'text', 'button', 'divider', 'social'];
      
      if (basicBlockIds.includes(draggedBlock.id)) {
        console.log('🎨 Apertura automatica editor per blocco BASE:', draggedBlock.id);
        
        // Piccolo delay per assicurarsi che il blocco sia renderizzato
        setTimeout(() => {
          setEditingSingleBlock({
            ...newBlock,
            index: updatedBlocks.length - 1 // Indice dell'ultimo blocco aggiunto
          });
          setShowSingleBlockEditor(true);
          toast.success(`✏️ Editor ${draggedBlock.name} aperto!`, { duration: 2000 });
        }, 150);
      }
      
      return updatedBlocks;
    });
    
    setEmailContent((prev) => prev + draggedBlock.html);
    
    // ✅ USA closeEditor() dal context
    closeEditor();
    
    console.log('📦 New block created:', newBlock);
    toast.success(`🧱 Blocco "${draggedBlock.name}" aggiunto`);
    
    console.log('activeStyleBlock dopo drop:', activeStyleBlock);
    console.log('showSectionEditor dopo drop:', showSectionEditor);
  }

  setDraggedBlock(null);
  setGhostBlock(null);
};
 // 🔁 Riordinamento dei blocchi nel canvas
const handleCanvasDragStart = (index) => setDraggingIndex(index);

const handleCanvasDragOver = (e, index) => {
  e.preventDefault();
  if (draggingIndex === null || draggingIndex === index) return;
  const updatedBlocks = [...canvasBlocks];
  const [moved] = updatedBlocks.splice(draggingIndex, 1);
  updatedBlocks.splice(index, 0, moved);
  setCanvasBlocks(updatedBlocks);
  setDraggingIndex(index);
};

const handleCanvasDrop = () => setDraggingIndex(null);
  
  // 🗑️ Rimuovi un blocco dal canvas
// ✅ CORRETTO
const handleRemoveBlock = (index) => {
  const blockToRemove = canvasBlocks[index];
  const newBlocks = canvasBlocks.filter((_, i) => i !== index);
  setCanvasBlocks(newBlocks);
  toast.success(`🗑️ Blocco "${blockToRemove?.name || 'sconosciuto'}" rimosso`);
};

  // Validazione email
  const validateEmails = (input) => {
    if (!input) return { valid: true, invalidDomains: [] };
    const emails = input.split(",").map((e) => e.trim()).filter(Boolean);
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const allowedDomains = [".it", ".com", ".eu", ".org", ".net", ".co"];
    const forbiddenDomains = ["localhost", "test", "mailinator", "example"];

    const invalidDomains = emails.filter((email) => {
      if (!regex.test(email)) return true;
      const domain = email.split("@")[1]?.toLowerCase() || "";
      const hasAllowedExtension = allowedDomains.some((ext) => domain.endsWith(ext));
      const isForbidden = forbiddenDomains.some((bad) => domain.includes(bad));
      return !hasAllowedExtension || isForbidden;
    });

    return { valid: invalidDomains.length === 0, invalidDomains };
  };

  const handleCcChange = (value) => {
    setCc(value);
    const result = validateEmails(value);
    if (!result.valid) {
      setCcError(`Domini non validi: ${result.invalidDomains.join(", ")}. Usa solo domini professionali.`);
    } else {
      setCcError("");
    }
  };

  const handleBccChange = (value) => {
    setBcc(value);
    const result = validateEmails(value);
    if (!result.valid) {
      setBccError(`Domini non validi: ${result.invalidDomains.join(", ")}. Usa solo domini professionali.`);
    } else {
      setBccError("");
    }
  };

  // 🧠 Avvia inline editing
// 🧠 Avvia inline editing + apre editor avanzato
const handleInlineStart = (block, index) => {
  // 1️⃣ Inline editing
  setInlineEditing({ index, block });

  const parser = new DOMParser();
  const doc = parser.parseFromString(block.html, "text/html");

  const editableNode =
    doc.querySelector("h1, h2, h3, p, span, a, td, div") || doc.body;

  setInlineValue(editableNode.innerHTML);

  // 2️⃣ Imposta il blocco come target dell’editor avanzato
  setEditingSingleBlock({
    ...block,
    index,
  });

  // 3️⃣ Mostra il modal avanzato
  setShowSingleBlockEditor(true);

  // 4️⃣ Rimuovi eventuali pannelli stili aperti
  setActiveStyleBlock(null);

  console.log("🎨 Editor avanzato aperto per:", block.id);
};



  const applyInlineEdit = () => {
    if (!inlineEditing) return;
  
    const updated = [...canvasBlocks];
    const block = updated[inlineEditing.index];
  
    let html = block.html;
  
    // Cerca il tag da sostituire
    const replaced = html.replace(
      /<(h1|h2|h3|p|span|a|div|td)([^>]*)>.*?<\/(h1|h2|h3|p|span|a|div|td)>/s,
      `<$1$2>${inlineValue}</$1>`
    );
  
    updated[inlineEditing.index] = {
      ...block,
      html: replaced,
    };
  
    setCanvasBlocks(updated);
    setInlineEditing(null);
    toast.success("✏️ Testo aggiornato!");
  };
  

useEffect(() => {
  const handleClickOutside = (e) => {
    if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
      setShowTextToolbar(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);


// 💾 Salva inline edit (on blur)
useEffect(() => {
  if (!inlineEditing || !editorRef.current) return;

  const el = editorRef.current;

  const handleBlur = () => {
    const updated = [...canvasBlocks];

    updated[inlineEditing.index] = {
      ...canvasBlocks[inlineEditing.index],
      html: el.innerHTML, // 🟢 SALVA IL CONTENUTO CORRETTO
    };

    setCanvasBlocks(updated);
    setInlineEditing(null);
    toast.success("✏️ Modifica salvata!");
  };

  el.addEventListener("blur", handleBlur);
  return () => el.removeEventListener("blur", handleBlur);
}, [inlineEditing, canvasBlocks]);

const handleGoBack = () => {
  console.log('🚀🚀🚀 handleGoBack CHIAMATO!');
  console.log('🔍 onCloseBuilder disponibile?', !!onCloseBuilder);
  const editingId = sessionStorage.getItem('editingCampaignId');
  console.log('🔙 handleGoBack - editingId:', editingId);
  // ✅ CASO 1: Stiamo modificando una campagna esistente
  if (editingId) {
    toast((t) => (
      <div className="p-3">
        <p className="font-medium text-gray-800">
          Vuoi davvero uscire dal builder?
        </p>
        <p className="text-sm text-gray-500 mb-3">
          Tornerai alla modifica della campagna.
        </p>

        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm"
          >
            Annulla
          </button>

          <button
            onClick={() => {
              toast.dismiss(t.id);
              console.log('✅ Chiamando onCloseBuilder');
              // ✅ Pulisci sessionStorage (opzionale)
              sessionStorage.removeItem('builderTemplate');
              sessionStorage.removeItem('builderBlocks');
              sessionStorage.removeItem('currentEmailContent');
              sessionStorage.removeItem('isBuilderTemplate');
              // sessionStorage.removeItem('editingCampaignId');
              // sessionStorage.removeItem('editingCampaignData');
              
              // ✅ Chiudi il builder e riapri EditCampaignModal
              if (onCloseBuilder) {
                onCloseBuilder();
              } else {
                console.log('❌ onCloseBuilder non disponibile!');
                setCampaignMode(null);
                setShowCampaignModal(false);
              }
              
              toast.success("✔ Tornando alla modifica campagna");
            }}
            className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
          >
            Torna Indietro
          </button>
        </div>
      </div>
    ), { duration: 6000 });
    
    return;
  }

  // ✅ CASO 2: Nuova campagna - comportamento normale
  if (campaignName || subject || emailContent !== "<p></p>" || attachments.length > 0) {
    toast((t) => (
      <div className="p-3">
        <p className="font-medium text-gray-800">
          Vuoi davvero tornare indietro?
        </p>
        <p className="text-sm text-gray-500 mb-3">
          Le modifiche non salvate andranno perse.
        </p>

        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm"
          >
            Annulla
          </button>

          <button
            onClick={() => {
              toast.dismiss(t.id);
              // 🔥 reset campagna
              setCampaignMode(null);
              setCampaignName("");
              setSubject("");
              setEmailContent("<p></p>");
              setRecipientList([]);
              setAttachments([]);
              setCc("");
              setBcc("");
              setCcError("");
              setBccError("");

              toast.success("✔ Uscito senza salvare");
            }}
            className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
          >
            Continua
          </button>
        </div>
      </div>
    ), { duration: 6000 });

    return;
  }

  // Nessuna modifica → esce direttamente
  setCampaignMode(null);
};

  const hasChanges = campaignName || subject || emailContent !== "<p></p>" || attachments.length > 0;

  const handleCancel = () => {
    if (hasChanges) setShowConfirmExit(true);
    else 
    // 🔥 AGGIUNGI QUESTA PULIZIA
  sessionStorage.removeItem('isBuilderTemplate');
  setIsBuilderTemplate(false);
   setShowCampaignModal(false);
  };

  const handleSend = () => {
    console.log('🚀 handleSend chiamato');
  console.log('📧 selectedAccount:', selectedAccount);
  console.log('📋 recipientList:', recipientList);
  console.log('📊 contacts:', contacts?.length || 0);
  
    if (!selectedAccount) {
      console.log('❌ Nessun account selezionato');
      alert("⚠️ Seleziona un account di invio prima di procedere.");
      return;
    }
    if (ccError || bccError) {
      console.log('❌ Errori in CC/BCC:', { ccError, bccError });
      alert("⚠️ Correggi gli indirizzi email non validi prima di inviare.");
      return;
    }
    
    // 🔥 AGGIUNGI QUESTA PULIZIA
    sessionStorage.removeItem('isBuilderTemplate');
    setIsBuilderTemplate(false);
    
    console.log('✅ Aprendo modale di conferma');
    setShowConfirmSend(true);
  };

  const resolveRecipients = () => {
    // caso ALL
    if (
      recipientList === "all" ||
      (Array.isArray(recipientList) && recipientList.includes("all"))
    ) {
      return contacts; // 🔥 TUTTI I CONTATTI REALI
    }
  
    // caso selezione manuale
    return contacts.filter(c =>
      recipientList.includes(c.email)
    );
  };

  const insertCampaignRecipients = async (campaignId, recipients) => {
    const rows = recipients.map(c => ({
      campaign_id: campaignId,
      contact_id: c.id,
      email: c.email,
      name: c.name,
      status: "sent"
    }));
  
    const { error } = await supabase
      .from("campaign_recipients")
      .insert(rows);
  
    if (error) throw error;
  };
  
  

  const handleConfirmSend = async () => {
   // ✅✅✅ AGGIUNGI QUESTO COME PRIMA COSA ✅✅✅
  console.log('═══════════════════════════════════════');
  console.log('🔍 STATO INIZIALE handleConfirmSend:');
  console.log('═══════════════════════════════════════');
  console.log('selectedAccount:', selectedAccount);
  console.log('subject:', subject);
  console.log('emailContent:', typeof emailContent, emailContent?.substring(0, 100));
  console.log('emailHTML:', typeof emailHTML, emailHTML?.substring(0, 100));
  console.log('═══════════════════════════════════════');
    setShowConfirmSend(false);
    setIsSending(true);
    setProgress(0);
    setSentCount(0);
    setFailedCount(0);
  
    try {
      // ✅ 1. Verifica account selezionato
      if (!selectedAccount) {
        toast.error("⚠️ Seleziona un account di invio!");
        setIsSending(false);
        return;
      }
  
      console.log('📧 Account selezionato:', selectedAccount);
  
      // ✅ 2. Calcola recipients
      const recipients = recipientList.includes("all")
        ? contacts.filter((c) => c.status === "active").map((c) => c.email)
        : recipientList.includes("premium")
        ? contacts.filter((c) => c.tags?.includes("premium")).map((c) => c.email)
        : recipientList.includes("prospect")
        ? contacts.filter((c) => c.tags?.includes("prospect")).map((c) => c.email)
        : Array.isArray(recipientList) ? recipientList : [];
  
      console.log('📋 Recipients:', recipients.length);
  
      if (recipients.length === 0) {
        toast.error("⚠️ Nessun destinatario trovato!");
        setIsSending(false);
        return;
      }
  
      setTotalRecipients(recipients.length);
  
      // ✅ 3. Prepara allegati
      const attachmentsData = await Promise.all(
        attachments.map(async (a) => ({
          filename: a.file.name,
          content: await fileToBase64(a.file),
        }))
      );
  
      // ✅ 4. Salva campagna (draft inizialmente)
      const campaignData = {
        campaignName: subject, // Usa subject come nome se campaignName non esiste
        subject,
        emailContent: emailHTML,
        recipientList,
        recipients,
        cc: cc || "",
        bcc: bcc || "",
        senderEmail: selectedAccount.email,
        attachments: attachments.map(a => ({
          filename: a.file.name,
          size: a.file.size,
          type: a.file.type
        })),
        totalAttachmentSize: attachments.reduce((sum, a) => sum + a.file.size, 0),
        trackingEnabled: true,
        openTracking: true,
        clickTracking: true,
        status: "sending",
      };
  
      const saveResult = await saveCampaign(campaignData, false);
  
      if (!saveResult.success) {
        throw new Error('Impossibile salvare la campagna');
      }
  
      const campaignId = saveResult.data.id;
  
      // ✅ 5. INVIO tramite provider corretto
      let successCount = 0;
      let failedRecipients = [];
  
      // 🔀 BRANCHING: Resend vs SMTP
      if (selectedAccount.provider === "resend") {
        // ========== RESEND API ==========
        const resendApiKey = process.env.NEXT_PUBLIC_RESEND_API_KEY;
  
        if (!resendApiKey) {
          throw new Error("API key Resend mancante");
        }
  
        for (let i = 0; i < recipients.length; i++) {
          const payload = {
            from: selectedAccount.email,
            to: [recipients[i]],
            subject,
            html: emailHTML,
            cc: cc ? cc.split(",").map((e) => e.trim()).filter(Boolean) : [],
            bcc: bcc ? bcc.split(",").map((e) => e.trim()).filter(Boolean) : [],
            attachments: attachmentsData,
          };
  
          try {
            const response = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });
  
            if (response.ok) {
              successCount++;
              setSentCount(prev => prev + 1);
            } else {
              setFailedCount(prev => prev + 1);
              failedRecipients.push(recipients[i]);
            }
          } catch (error) {
            console.error('Errore invio:', error);
            setFailedCount(prev => prev + 1);
            failedRecipients.push(recipients[i]);
          }
  
          setProgress(Math.round(((i + 1) / recipients.length) * 100));
        }
  
      } else {
        // ========== SMTP (Brevo, Gmail, ecc.) ==========
        
        // Invio email una alla volta per mostrare il progresso
        for (let i = 0; i < recipients.length; i++) {

          // Nel loop SMTP, PRIMA di creare il payload
console.log('🔍 DEBUG INVIO:', {
  subject: subject || 'MANCANTE ❌',
  emailHTML: emailHTML ? `${emailHTML.length} char ✅` : 'MANCANTE ❌',
  from: selectedAccount.email || 'MANCANTE ❌',
  to: recipients[i] || 'MANCANTE ❌',
  smtp: selectedAccount.smtp ? 'presente ✅' : 'MANCANTE ❌'
});
const payload = {
  user_id: user.id,
  from: selectedAccount?.email || "", // ✅ Aggiungi fallback
  to: [recipients[i]],
  cc: cc ? cc.split(",").map((e) => e.trim()).filter(Boolean) : [],
  bcc: bcc ? bcc.split(",").map((e) => e.trim()).filter(Boolean) : [],
  subject: subject || "",
  html: emailContent || emailHTML || "", // ✅ Prova entrambi
  attachments: attachmentsData,
  smtp: selectedAccount?.smtp || {}, // ✅ Aggiungi fallback
};
  
          try {
            console.log(`📤 Invio ${i + 1}/${recipients.length} a ${recipients[i]}...`);
  
            const response = await fetch("/api/send-campaign", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
  
            const result = await response.json();
  
            if (result.success && result.sent > 0) {
              successCount++;
              setSentCount(prev => prev + 1);
              console.log(`✅ Inviata a ${recipients[i]}`);
            } else {
              setFailedCount(prev => prev + 1);
              failedRecipients.push(recipients[i]);
              console.error(`❌ Fallita a ${recipients[i]}:`, result.message);
            }
          } catch (error) {
            console.error(`💥 Errore invio a ${recipients[i]}:`, error);
            setFailedCount(prev => prev + 1);
            failedRecipients.push(recipients[i]);
          }
  
          setProgress(Math.round(((i + 1) / recipients.length) * 100));
        }
      }
  
      // ✅ 6. Aggiorna campagna con risultati
      await updateCampaignAfterSend(campaignId, {
        sentCount: successCount,
        failedCount: failedRecipients.length,
        totalRecipients: recipients.length,
        status: "sent",
      });
  
      // ✅ 7. Salva log
      // const logs = JSON.parse(localStorage.getItem("emailLogs") || "[]");
      // const newLog = {
      //   id: campaignId,
      //   name: subject,
      //   subject,
      //   recipients: recipients.length,
      //   opened: 0,
      //   status: "sent",
      //   sentAt: new Date().toISOString(),
      // };
      // localStorage.setItem("emailLogs", JSON.stringify([...logs, newLog]));

      const logsPayload = recipients.map(email => ({
        campaign_id: campaignId,
        user_id: user.id,
        sender_email: accountObj.email,
        recipient_email: email,
        subject,
        status: failedRecipients.includes(email) ? "failed" : "sent",
        provider: accountObj.provider,
      }));
      
      await supabase.from("email_logs").insert(logsPayload);
  
      // ✅ 8. Mostra risultato
      toast.dismiss();
  
      if (failedRecipients.length === 0) {
        toast.success(`✅ Campagna inviata con successo a ${successCount} destinatari!`);
        setTimeout(() => exportResendLog && exportResendLog("csv", true), 1500);
      } else {
        toast.success(
          `⚠️ Completata: ${successCount} inviate, ${failedRecipients.length} fallite`
        );
      }
  
      setTimeout(() => {
        setIsSending(false);
        setShowCampaignModal && setShowCampaignModal(false);
        if (typeof setShowEmailModal !== 'undefined') {
          setShowEmailModal(false);
        }
        if (typeof setShowCampaignModal !== 'undefined') {
          setShowCampaignModal(false);
        }
        setShowSuccess && setShowSuccess(true);
        setTimeout(() => setShowSuccess && setShowSuccess(false), 3000);
      }, 1500);
  
    } catch (error) {
      console.error('❌ Errore durante l\'invio:', error);
      toast.error(`❌ ${error.message}`);
      setIsSending(false);
    }
  };
  // Gestione allegati
  const handleAddAttachments = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newFiles = files.map((file) => ({
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        filename: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
      }));
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveAttachment = (index) => {
    const removed = attachments[index];
    if (removed.preview) URL.revokeObjectURL(removed.preview);
    if (removed.url) URL.revokeObjectURL(removed.url);
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const totalSize = useMemo(() => {
    const bytes = attachments.reduce((sum, a) => sum + (a.file?.size || a.size || 0), 0);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }, [attachments]);

  const getFileIcon = (type, filename) => {
    if (type?.includes("pdf")) return "📕";
    if (type?.includes("zip") || filename?.endsWith(".zip")) return "🗜️";
    if (type?.includes("word") || filename?.endsWith(".docx")) return "📘";
    if (type?.includes("excel") || filename?.endsWith(".xls")) return "📗";
    if (type?.includes("text") || filename?.endsWith(".txt")) return "📄";
    return "📁";
  };

  // 💾 Persistenza log in localStorage
useEffect(() => {
  const savedLog = localStorage.getItem("resendLog");
  if (savedLog) setResendLog(JSON.parse(savedLog));
}, []);

useEffect(() => {
  localStorage.setItem("resendLog", JSON.stringify(resendLog));
}, [resendLog]);


  // Salva bozza
  // Salva bozza
const handleSaveDraft = async () => {
  if (!campaignName || !subject) {
    setShowDraftError(true);
    setTimeout(() => setShowDraftError(false), 3000);
    return;
  }

  try {
    const campaignData = {
      campaignName,
      subject,
      emailContent,
      recipientList,
      senderEmail: selectedAccount,
      cc,
      bcc,
      attachments: attachments.map((a) => ({
        filename: a.file?.name || a.filename,
        size: a.file?.size || a.size,
        type: a.file?.type || a.type,
      })),
      totalAttachmentSize: attachments.reduce(
        (sum, a) => sum + (a.file?.size || a.size || 0),
        0
      ),
      status: "draft", // ✅ Questo è corretto
      savedAt: new Date().toISOString(),
    };

    console.log('💾 Saving draft with data:', campaignData); // ✅ DEBUG

    const { success, data, error } = await saveCampaign(campaignData, true);

    console.log('📥 Save result:', { success, data, error }); // ✅ DEBUG
    console.log('📋 Status saved:', data?.status); // ✅ DEBUG

    if (!success) throw new Error(error);

    setLastSavedData(campaignData);
    setLastAutoSave(new Date());

    // 🔥 Pulizia session storage
    sessionStorage.removeItem('isBuilderTemplate');
    setIsBuilderTemplate(false);

    // ✅ FORZA IL RELOAD DELLE CAMPAGNE
    console.log('🔄 Reloading campaigns...');
    await loadCampaigns();
    console.log('✅ Campaigns reloaded');

    setShowDraftSuccess(true);
    setTimeout(() => setShowDraftSuccess(false), 2000);
    setTimeout(() => setShowCampaignModal(false), 2300);

    if (onSaveDraft) onSaveDraft(data);
    
    // ✅ Toast di conferma
    toast.success('💾 Bozza salvata con successo!', { duration: 2000 });
  } catch (error) {
    console.error("❌ Errore salvataggio bozza:", error);
    toast.error("Errore nel salvataggio della bozza: " + error.message);
  }
};
  // Conferma invio
  const confirmSend = async () => {
    console.log('═══════════════════════════════════════');
    console.log('🔍 DEBUG confirmSend:');
    console.log('  selectedAccount (stringa):', selectedAccount);
    
    // ✅ Trova l'oggetto account completo
    const accountObj = accounts.find(acc => acc.email === selectedAccount);
    
    console.log('  accountObj trovato:', accountObj);
    console.log('  accountObj.email:', accountObj?.email);
    console.log('  accountObj.smtp:', accountObj?.smtp);
    console.log('  subject:', subject);
    console.log('  emailContent:', emailContent?.substring(0, 100));
    console.log('═══════════════════════════════════════');
  
    setShowConfirmSend(false);
    setIsSending(true);
    setProgress(0);
    setSentCount(0);
    setFailedCount(0);
  
    try {
      // ✅ Usa accountObj invece di selectedAccount
      if (!accountObj) {
        toast.error("⚠️ Account non trovato!");
        setIsSending(false);
        return;
      }
  
      console.log('📧 Account completo:', accountObj);
  
      // ✅ 2. Calcola recipients
      const recipients = recipientList.includes("all")
        ? contacts.filter((c) => c.status === "active").map((c) => c.email)
        : recipientList.includes("premium")
        ? contacts.filter((c) => c.tags?.includes("premium")).map((c) => c.email)
        : recipientList.includes("prospect")
        ? contacts.filter((c) => c.tags?.includes("prospect")).map((c) => c.email)
        : Array.isArray(recipientList) ? recipientList : [];
  
      console.log('📋 Recipients:', recipients.length);
  
      if (recipients.length === 0) {
        toast.error("⚠️ Nessun destinatario trovato!");
        setIsSending(false);
        return;
      }
  
      setTotalRecipients(recipients.length);
  
      // ✅ 3. Prepara allegati
      const attachmentsData = await Promise.all(
        attachments.map(async (a) => ({
          filename: a.file.name,
          content: await fileToBase64(a.file),
        }))
      );
  
      // ✅ 4. Salva campagna
      const campaignData = {
        campaignName,
        subject,
        emailContent,
        recipientList,
        recipients,
        cc,
        bcc,
        senderEmail: accountObj.email, // ✅ Usa accountObj
        attachments: attachments.map(a => ({
          filename: a.file.name,
          size: a.file.size,
          type: a.file.type
        })),
        totalAttachmentSize: attachments.reduce((sum, a) => sum + a.file.size, 0),
        trackingEnabled: true,
        openTracking: true,
        clickTracking: true,
        status: "sending",
      };
  
      const saveResult = await saveCampaign(campaignData, false);
  
      if (!saveResult.success) {
        throw new Error('Impossibile salvare la campagna');
      }
  
      const campaignId = saveResult.data.id;
  
      // ✅ 5. INVIO tramite provider corretto
      let successCount = 0;
      let failedRecipients = [];
  
      // 🔀 BRANCHING: Resend vs SMTP
      if (accountObj.provider === "resend") {
        // ========== RESEND API ==========
        const resendApiKey = process.env.NEXT_PUBLIC_RESEND_API_KEY;
  
        if (!resendApiKey) {
          throw new Error("API key Resend mancante");
        }
  
  
        for (let i = 0; i < recipients.length; i++) {
          // Nel blocco SMTP, PRIMA di creare il payload
console.log('🔍 Account trovato:', accountObj);
console.log('🔍 accountObj.smtp:', accountObj.smtp);
console.log('🔍 accounts array:', accounts);
          const payload = {
            apiKey: resendApiKey, // ✅ Passa l'API key al proxy
            from: accountObj.email,
            to: [recipients[i]],
            subject,
            html: emailContent,
            cc: cc ? cc.split(",").map((e) => e.trim()).filter(Boolean) : [],
            bcc: bcc ? bcc.split(",").map((e) => e.trim()).filter(Boolean) : [],
            subject,
            html: emailContent,
            attachments: attachmentsData,
          };
  
          try {
            const response = await fetch("/api/resend/send", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });
  
            if (response.ok) {
              successCount++;
              setSentCount(prev => prev + 1);
            } else {
              setFailedCount(prev => prev + 1);
              failedRecipients.push(recipients[i]);
            }
          } catch (error) {
            console.error('Errore invio:', error);
            setFailedCount(prev => prev + 1);
            failedRecipients.push(recipients[i]);
          }
  
          setProgress(Math.round(((i + 1) / recipients.length) * 100));
        }
  
      } else {
        // ========== SMTP (Brevo, Gmail, ecc.) ==========
        // Nel blocco SMTP, PRIMA di creare il payload
console.log('🔍 Account trovato:', accountObj);
console.log('🔍 accountObj.smtp:', accountObj.smtp);
console.log('🔍 accounts array:', accounts);
        const payload = {
          apiKey: resendApiKey, // ✅ Passa l'API key al proxy
          user_id: user.id,
          from: accountObj.email, // ✅ Usa accountObj
          to: recipients,
          cc: cc ? cc.split(",").map((e) => e.trim()).filter(Boolean) : [],
          bcc: bcc ? bcc.split(",").map((e) => e.trim()).filter(Boolean) : [],
          subject,
          html: emailContent,
          attachments: attachmentsData,
          smtp: accountObj.smtp, // ✅ Usa accountObj
        };
  
        console.log('📤 Payload:', payload);
        console.log('📤 Invio via SMTP...');
  
        const response = await fetch("/api/resend/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
  
        const result = await response.json();
        console.log('📥 Risultato SMTP:', result);
  
        if (!result.success) {
          throw new Error(result.message || "Errore durante l'invio");
        }
  
        successCount = result.sent;
        failedRecipients = result.errors?.map(e => e.email) || [];
        setSentCount(result.sent);
        setFailedCount(result.failed || 0);
        setProgress(100);
      }
  
  
      // ✅ 6. Aggiorna campagna con risultati
      await updateCampaignAfterSend(campaignId, {
        sentCount: successCount,
        failedCount: failedRecipients.length,
        totalRecipients: recipients.length,
        status: "sent",
      });
  
      // ✅ 7. Salva log
      // const logs = JSON.parse(localStorage.getItem("emailLogs") || "[]");
      // const newLog = {
      //   id: campaignId,
      //   name: campaignName,
      //   subject,
      //   recipients: recipients.length,
      //   opened: 0,
      //   status: "sent",
      //   sentAt: new Date().toISOString(),
      // };
      // localStorage.setItem("emailLogs", JSON.stringify([...logs, newLog]));
  // ✅ 7. Salva log su Supabase
const logsPayload = recipients.map(email => ({
  campaign_id: campaignId,
  user_id: user.id,
  sender_email: accountObj.email,
  recipient_email: email,
  subject,
  status: failedRecipients.includes(email) ? "failed" : "sent",
  provider: accountObj.provider,
}));

await supabase.from("email_logs").insert(logsPayload);
      // ✅ 8. Mostra risultato
      toast.dismiss();
  
      if (failedRecipients.length === 0) {
        toast.success(`✅ Campagna inviata con successo a ${successCount} destinatari!`);
        setTimeout(() => exportResendLog("csv", true), 1500);
      } else {
        toast.success(
          `⚠️ Completata: ${successCount} inviate, ${failedRecipients.length} fallite`
        );
      }
  
      setTimeout(() => {
        setIsSending(false);
        setShowCampaignModal(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }, 1500);
  
    } catch (error) {
      console.error('❌ Errore durante l\'invio:', error);
      toast.error(`❌ ${error.message}`);
      setIsSending(false);
    }
  };

  const confirmExit = () => {
    setShowConfirmExit(false);
    setShowCampaignModal(false);
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  useEffect(() => {
    console.log('🔄 useEffect caricamento template - inizio');
    console.log('🔍 campaignMode:', campaignMode);
  
    // 1️⃣ Prova prima a caricare i blocchi salvati (JSON)
    const savedBlocks = sessionStorage.getItem('editingBuilderBlocks') || sessionStorage.getItem('builderBlocks');
    
    if (savedBlocks) {
      try {
        const blocks = JSON.parse(savedBlocks);
        console.log('✅ Ripristino blocchi salvati:', blocks.length, 'blocchi');
        setCanvasBlocks(blocks);
        toast.success('✅ Template caricato nel builder!', { duration: 2000 });
        sessionStorage.removeItem('editingBuilderBlocks');
        sessionStorage.removeItem('builderBlocks');
        return;
      } catch (e) {
        console.error('❌ Errore parsing blocchi:', e);
      }
    }
  
    // 2️⃣ Fallback: prova a ricostruire dall'HTML
    const editingTemplate = sessionStorage.getItem('editingBuilderTemplate');
    
    if (editingTemplate) {
      console.log('🔄 Tentativo ricostruzione da HTML...');
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = editingTemplate;
      
      const tables = tempDiv.querySelectorAll('table[role="presentation"]');
      
      if (tables.length > 0) {
        const reconstructedBlocks = Array.from(tables).map((table, index) => {
          const html = table.outerHTML;
          const tdCount = table.querySelectorAll('td[style*="padding"]').length;
          let blockType = 'section-1col';
          
          if (tdCount === 2) blockType = 'section-2col';
          else if (tdCount === 3) blockType = 'section-3col';
          
          return {
            id: blockType,
            name: `Sezione ${tdCount} Colonna`,
            icon: '▭',
            category: 'layout',
            html: html,
            instanceId: `${blockType}-${Date.now()}-${index}`
          };
        });
        console.log('✅ Blocchi ricostruiti:', reconstructedBlocks.length);
        setCanvasBlocks(reconstructedBlocks);
        toast.success('✅ Template caricato dal backup!', { duration: 2000 });
      } else {
        console.log('⚠️ Nessuna tabella trovata nell\'HTML');
        toast.error('⚠️ Impossibile caricare il template. Creane uno nuovo.', { duration: 3000 });
      }
      
      sessionStorage.removeItem('editingBuilderTemplate');
      return;
    }
  
    // 3️⃣ Nessun dato da caricare - questo è corretto
    console.log('ℹ️ Nessun template da caricare, builder pulito');
    
    console.log('🔄 useEffect caricamento template - fine');
}, [campaignMode]); // ✅ Solo campaignMode come dipendenza
   // Nel builder, aggiungi questo useEffect
   useEffect(() => {
    console.log('🔄 canvasBlocks aggiornati:', canvasBlocks.length, 'blocchi');
    canvasBlocks.forEach((block, i) => {
      console.log(`  [${i}] ${block.name}:`, block.html.substring(0, 50));
    });
  }, [canvasBlocks]);
  useEffect(() => {
    const storedBlocks = JSON.parse(localStorage.getItem('savedBlocks')) || [];
    setSavedBlocks(storedBlocks);
  }, []);
  

  useEffect(() => {
    if (allAccounts.length > 0) {
      // Trova l'account predefinito in allAccounts
      const defaultAcc = allAccounts.find(acc => acc.is_default);
      if (defaultAcc) {
        setSelectedAccount(defaultAcc.email);
      } else if (allAccounts[0]) {
        // Se non c'è un default, usa il primo
        setSelectedAccount(allAccounts[0].email);
      }
    }
  }, [allAccounts]);

  const handleSelectTemplate = (template) => {
    setEmailContent(template.html);
    setShowTemplateLibrary(false);
    toast.success(`Template "${template.name}" caricato!`);
  };
  const handleAddSavedBlock = (block) => {
    const currentContent = emailContent === "<p></p>" ? "" : emailContent;
    setEmailContent(currentContent + block.html);
    toast.success(`Blocco "${block.name}" aggiunto!`);
  };
  // 🆕 Funzione per aggiungere blocco dal builder
  const handleAddBlock = (block) => {
    // Se è un pulsante, apri l'editor avanzato per impostare lo stile
    if (block.id === 'button') {
      setEditingButton(true);
      
      // Salva il pulsante personalizzato nella lista dei blocchi salvati
      saveCustomBlock(block);
      
      // Reset valori
      setButtonText('Scarica il Comunicato Stampa');
      setButtonLink('https://esempio.com');
      setButtonColor('#ffa500');
      setButtonTextColor('#ffffff');
      setOpenInNewTab(true);
      
      // Reset valori stili
      setButtonAlignment('center');
      setButtonSize('medio');
      setButtonShape('rotondo');
      setBorderType('none');
      setBorderWidth(0);
      setBorderColor('#000000');
      setPaddingTop(15);
      setPaddingBottom(15);
      setPaddingLeft(40);
      setPaddingRight(40);
      setApplyPaddingAll(false);
      
      return;
    }


// 🆕 Handler quando il drag finisce
const handleDragEnd = () => {
  setDraggedBlock(null);
};

// 🆕 Handler quando si passa sopra la drop zone
const handleDragOver = (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  setIsDraggingOver(true);
};

// 🆕 Handler quando si esce dalla drop zone
const handleDragLeave = () => {
  setIsDraggingOver(false);
};


// 🆕 Rimuovi blocco
const handleRemoveBlock = (index) => {
  const newBlocks = canvasBlocks.filter((_, i) => i !== index);
  setCanvasBlocks(newBlocks);
  toast.success('🗑️ Blocco rimosso!');
};

// 🆕 Sposta blocco su/giù
const handleMoveBlock = (index, direction) => {
  const newBlocks = [...canvasBlocks];
  if (direction === 'up' && index > 0) {
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
  } else if (direction === 'down' && index < newBlocks.length - 1) {
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
  }
  setCanvasBlocks(newBlocks);
};

// 📤 Esporta log in CSV o TXT
const exportResendLog = (format = "csv", auto = false) => {
  if (resendLog.length === 0) {
    if (!auto) toast.error("⚠️ Nessun log da esportare");
    return;
  }

  const header = ["Email", "Stato", "Messaggio", "Data/Ora"];
  const rows = resendLog.map(log => [
    log.email,
    log.status.toUpperCase(),
    log.message.replace(/\n/g, " "),
    log.timestamp,
  ]);

  let content = "";

  if (format === "csv") {
    const csvRows = [header.join(";"), ...rows.map(r => r.join(";"))];
    content = csvRows.join("\n");
  } else {
    // TXT semplice
    content = resendLog
      .map(log => `📧 ${log.email}\n🕒 ${log.timestamp}\n${log.status === "success" ? "✅" : "❌"} ${log.message}\n---`)
      .join("\n");
  }

  const blob = new Blob([content], {
    type: format === "csv" ? "text/csv;charset=utf-8;" : "text/plain;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `resend_log_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.${format}`;
  a.click();
  URL.revokeObjectURL(url);

  if (!auto) toast.success(`📁 Log esportato in formato ${format.toUpperCase()}`);
};


// 🆕 Genera HTML finale
const handleUseTemplate = () => {
  let finalHtml = '';
  canvasBlocks.forEach(block => {
    finalHtml += block.html;
  });
  setEmailContent(finalHtml);
  setCampaignMode('normal');
  toast.success("✅ Template pronto! Completa la campagna");
};
    
    // Aggiungi gli altri blocchi normalmente
    const currentContent = emailContent === "<p></p>" ? "" : emailContent;
    setEmailContent(currentContent + block.html);
    toast.success(`Blocco "${block.name}" aggiunto!`);
  };

  // 📤 Esporta il template come file HTML
const handleExportTemplate = () => {
  if (!canvasBlocks.length) {
    toast.error("⚠️ Nessun blocco da esportare!");
    return;
  }

  // Combina i blocchi in un unico HTML
  const finalHtml = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${campaignName || "Template Email"}</title>
</head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; background:#f9fafb;">
  ${canvasBlocks.map((b) => b.html).join("\n")}
</body>
</html>`;

  // Crea un blob e scarica il file
  const blob = new Blob([finalHtml], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${campaignName || "template_email"}.html`;
  link.click();
  URL.revokeObjectURL(url);

  toast.success("📤 Template esportato con successo!");
};


// 📧 Invia Email di Test (con modale elegante)
const handleSendTestEmail = async () => {
  if (!canvasBlocks.length) {
    toast.error("⚠️ Nessun contenuto da inviare!");
    return;
  }

  if (!testEmailAddress.trim()) {
    toast.error("⚠️ Inserisci un indirizzo email valido!");
    return;
  }

  const resendApiKey =
    localStorage.getItem("resend_api_key") || process.env.NEXT_PUBLIC_RESEND_API_KEY;
  const senderEmail = localStorage.getItem("resend_sender_email");

  if (!resendApiKey || !senderEmail) {
    toast.error("⚙️ Configura prima la chiave API e il mittente!");
    return;
  }

  try {
    setSendingTestEmail(true);

    const finalHtml = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${campaignName || "Template Email"}</title>
</head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; background:#f9fafb;">
  ${canvasBlocks.map((b) => b.html).join("\n")}
</body>
</html>`;

    const payload = {
      from: senderEmail,
      to: [testEmailAddress],
      subject: campaignName || "Anteprima Template Email",
      html: finalHtml,
    };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      toast.success(`✅ Email di test inviata a ${testEmailAddress}!`);
      setShowTestEmailModal(false);
      setTestEmailAddress("");
    } else {
      const err = await response.json();
      console.error(err);
      toast.error("❌ Errore durante l'invio dell'email di test");
    }
  } catch (error) {
    console.error("❌ Errore invio test:", error);
    toast.error("❌ Impossibile inviare l'email di test");
  } finally {
    setSendingTestEmail(false);
  }
};



// =====================================================================
// 🔧 FUNZIONE handleSaveButton COMPLETA CON TUTTI GLI STILI
// =====================================================================

// 🆕 Sostituisci la tua funzione handleSaveButton con questa versione completa

const handleSaveButton = () => {
  const shapeStyles = {
    quadrato: '0px',
    rotondo: '5px',
    pillola: '50px'
  };

  const sizeStyles = {
    piccolo: '14px',
    medio: '16px',
    grande: '18px'
  };

  const alignmentStyles = {
    left: 'left',
    center: 'center',
    right: 'right'
  };

  const paddingValue = applyPaddingAll 
    ? `${paddingTop}px ${paddingTop}px ${paddingTop}px ${paddingTop}px` 
    : `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`;

  const borderValue = borderWidth > 0 && borderType !== 'none'
    ? `${borderWidth}px ${borderType} ${borderColor}`
    : 'none';

  const buttonHtml = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto; width: 100%;">
      <tr>
        <td style="text-align: ${alignmentStyles[buttonAlignment]}; padding: 20px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="background: ${buttonColor}; border-radius: ${shapeStyles[buttonShape]}; ${borderValue !== 'none' ? `border: ${borderValue};` : ''}">
                <a href="${buttonLink}"
                   ${openInNewTab ? 'target="_blank" rel="noopener noreferrer"' : ''}
                   style="background: ${buttonColor}; color: ${buttonTextColor};
                          font-family: Arial, sans-serif;
                          font-size: ${sizeStyles[buttonSize]};
                          font-weight: bold;
                          text-decoration: none;
                          padding: ${paddingValue};
                          display: inline-block;
                          border-radius: ${shapeStyles[buttonShape]};">
                    ${buttonText}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  const currentContent = emailContent === "<p></p>" ? "" : emailContent;

  setEmailContent(currentContent + `<div data-type="custom-button">${buttonHtml}</div>`);

  toast.success(`✅ Pulsante "${buttonText}" aggiunto!`);
  setEditingButton(false);
};

  if (!showCampaignModal) return null;

  // 🆕 SCHERMATA SELEZIONE MODALITÀ (3 OPZIONI)
  if (campaignMode === null) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg p-8 w-full max-w-5xl mx-4 shadow-lg max-h-[90vh] overflow-y-auto"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Crea Nuova Campagna</h2>
            <p className="text-gray-600">Scegli come vuoi creare la tua campagna email</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Opzione 1: Campagna Standard */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                // 🔥 PULISCI TUTTO prima di entrare in modalità standard
                sessionStorage.removeItem('builderTemplate');
                sessionStorage.removeItem('builderBlocks');
                sessionStorage.removeItem('currentEmailContent');
                sessionStorage.removeItem('isBuilderTemplate');
                sessionStorage.removeItem('editingBuilderBlocks');
                sessionStorage.removeItem('editingBuilderTemplate');
                
                // Reset stati
                setEmailContent('<p></p>');
                setIsBuilderTemplate(false);
                setEditorKey(prev => prev + 1);
                
                // Ora apri la modalità standard
                setCampaignMode('normal');
              }}
              className="border-2 border-gray-200 rounded-xl p-6 cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all group"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500 transition-colors">
                  <Mail className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Campagna Standard</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Editor avanzato con formattazione ricca e personalizzazione completa.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    ✨ Editor Pro
                  </span>
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    📎 Allegati
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Opzione 2: Template Predefiniti */}
            <motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  onClick={() => setCampaignMode("template")} // ⬅️ Solo cambia modalità
  className="border-2 border-gray-200 rounded-xl p-6 cursor-pointer hover:border-purple-500 hover:shadow-lg transition-all group"
>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-500 transition-colors">
                  <FileText className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Template Predefiniti</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Scegli da una libreria di template professionali pronti all'uso.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                    🎨 Design Pro
                  </span>
                  <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                    ⚡ Veloce
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Opzione 3: Template Builder */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                // 🔥 Pulisci i blocchi precedenti quando apri builder da zero
                // 🔥 PULISCI TUTTO prima di entrare nel builder
              sessionStorage.removeItem('builderTemplate');
              sessionStorage.removeItem('builderBlocks');
              sessionStorage.removeItem('currentEmailContent');
              sessionStorage.removeItem('isBuilderTemplate');
              sessionStorage.removeItem('editingBuilderBlocks');
              sessionStorage.removeItem('editingBuilderTemplate');
              sessionStorage.removeItem('editingCampaignId');
              sessionStorage.removeItem('editingCampaignData');
             // Reset stati
             setEmailContent('<p></p>');
             setIsBuilderTemplate(false);
             setCanvasBlocks([]);
             
             setCampaignMode('builder');
              }}
              className="border-2 border-gray-200 rounded-xl p-6 cursor-pointer hover:border-green-500 hover:shadow-lg transition-all group relative"
            >
              <div className="text-center">
                {/* Badge "Nuovo" */}
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full animate-pulse">
                    NUOVO
                  </span>
                </div>
                
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-500 transition-colors">
                  <svg className="w-8 h-8 text-green-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 010 2H6v2a1 1 0 01-2 0V5zM20 5a1 1 0 00-1-1h-4a1 1 0 100 2h2v2a1 1 0 102 0V5zM4 19a1 1 0 001 1h4a1 1 0 100-2H6v-2a1 1 0 10-2 0v3zM20 19a1 1 0 01-1 1h-4a1 1 0 110-2h2v-2a1 1 0 112 0v3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Template Builder</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Crea il tuo template da zero con blocchi drag & drop.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                    🎯 Drag & Drop
                  </span>
                  <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                    🧩 Blocchi
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                // 🔥 PULISCI ANCHE QUANDO CHIUDI
                sessionStorage.removeItem('builderTemplate');
                sessionStorage.removeItem('builderBlocks');
                sessionStorage.removeItem('currentEmailContent');
                sessionStorage.removeItem('isBuilderTemplate');
                sessionStorage.removeItem('editingBuilderBlocks');
                sessionStorage.removeItem('editingBuilderTemplate');
                
                setShowCampaignModal(false);
              }}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Annulla
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 3. Aggiungi la libreria template DOPO la schermata selezione modalità
if (campaignMode === 'template') {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold mb-2">Template Predefiniti</h2>
              <p className="text-purple-100">Scegli un template professionale e personalizzalo</p>
            </div>
            <button
              onClick={() => setCampaignMode(null)}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Filtri Categoria */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-2 overflow-x-auto">
            {['Tutti', 'Newsletter', 'Promo', 'Eventi', 'Onboarding', 'Comunicazione', 'Prodotti'].map((cat) => (
              <button
                key={cat}
                className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition bg-white text-gray-700 hover:bg-purple-50 hover:text-purple-700"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Griglia Template */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {predefinedTemplates.map((template) => (
              <motion.div
                key={template.id}
                whileHover={{ y: -5 }}
                className="border-2 border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-purple-500 hover:shadow-lg transition-all group"
                
              >
                {/* Preview */}
                <div 
                  className="h-48 flex items-center justify-center text-white text-6xl"
                  style={{ background: template.color }}
                >
                  {template.category === 'Newsletter' && '📰'}
                  {template.category === 'Promo' && '🎁'}
                  {template.category === 'Eventi' && '🎉'}
                  {template.category === 'Onboarding' && '👋'}
                  {template.category === 'Comunicazione' && '📢'}
                  {template.category === 'Prodotti' && '📦'}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{template.name}</h3>
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        background: `${template.color}20`, 
                        color: template.color 
                      }}
                    >
                      {template.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  {/* 🔥 METTI IL CLICK QUI SUL BOTTONE */}
                  <button
                    onClick={() => {
                      console.log('🎯 Template selezionato:', template.name);

                      // 🔥 Crea un blocco canvas dal template HTML
                      const templateBlock = {
                        id: 'predefined-template',
                        name: template.name,
                        icon: '📄',
                        category: 'layout',
                        html: template.html,
                        instanceId: `${template.id}-${Date.now()}`
                      };

                      // 🔥 Salva il template come blocco per permettere modifiche
                      sessionStorage.setItem('builderBlocks', JSON.stringify([templateBlock]));
                      sessionStorage.setItem('currentEmailContent', template.html);
                      sessionStorage.setItem('isBuilderTemplate', 'true');

                      setEmailContent(template.html);
                      setIsBuilderTemplate(true);

                      setTimeout(() => {
                        setCampaignMode('normal');
                        setEditorKey(prev => prev + 1);
                        toast.success(`✅ Template "${template.name}" applicato!`);
                      }, 100);
                    }}
                    className="w-full bg-gray-100 group-hover:bg-purple-600 group-hover:text-white text-gray-700 py-2 rounded-lg font-medium transition"
                  >
                    Usa Template
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

 // 🆕 TEMPLATE BUILDER
if (campaignMode === 'builder') {
  // 🔥 useEffect per caricare template da modificare
 // Nel builder


  

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden shadow-2xl flex"
        >
          {/* Sidebar Blocchi */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="p-6">
  <div className="flex items-center justify-between mb-6">
    <div>
      <h3 className="text-lg font-bold text-gray-900">Blocchi di Contenuto</h3>
      <p className="text-sm text-gray-600">Trascina per aggiungere</p>
    </div>
    <button
      onClick={handleGoBack}
      className="text-gray-400 hover:text-gray-600"
      title="Torna indietro"
    >
      <ChevronLeft className="w-5 h-5" />
    </button>
  </div>

  {/* 📐 SEZIONI LAYOUT */}
  <div className="mb-8">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        📐 Sezioni Layout
      </h4>
    </div>
    
    <div className="space-y-3">
      {contentBlocks
        .filter(b => b.category === 'layout')
        .map((block) => (
          <motion.div
            key={block.id}
            draggable
            onDragStart={(e) => handleDragStart(block, e)}
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white border-2 border-gray-200 rounded-lg p-4 cursor-grab hover:border-blue-500 hover:shadow-md transition-all group active:cursor-grabbing"
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl shrink-0">{block.icon}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                  {block.name}
                </h4>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {block.description}
                </p>
              </div>
              <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors shrink-0" />
            </div>
          </motion.div>
      ))}
    </div>
  </div>

  {/* 🧩 ELEMENTI BASE */}
  <div>
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-4 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        🧩 Elementi Base
      </h4>
    </div>
    
    <div className="space-y-3">
      {contentBlocks
        .filter(b => b.category === 'basic')
        .map((block) => (
          <motion.div
            key={block.id}
            draggable
            onDragStart={(e) => handleDragStart(block, e)}
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white border-2 border-gray-200 rounded-lg p-4 cursor-grab hover:border-green-500 hover:shadow-md transition-all group active:cursor-grabbing"
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl shrink-0">{block.icon}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                  {block.name}
                </h4>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {block.description}
                </p>
              </div>
              <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors shrink-0" />
            </div>
          </motion.div>
      ))}
    </div>
  </div>

  {/* 💡 Suggerimento */}
  <div className="mt-6 p-4 bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-lg">
    <p className="text-xs text-green-800 leading-relaxed">
      <strong className="font-semibold">💡 Suggerimento:</strong> Inizia con una sezione Hero, aggiungi contenuti con le sezioni multi-colonna, e termina con un Footer professionale!
    </p>
  </div>
</div>
          </div>

          {/* Area Preview & Editor */}
          <div className="flex-1 flex flex-col relative">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Template Builder</h2>
                  <p className="text-green-100">Costruisci la tua email con blocchi personalizzati</p>
                </div>
                <button
                  onClick={handleGoBack}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Editor con area Drop */}
            <div className="flex-1 overflow-y-auto p-6 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Editor & Anteprima</label>

              {/* Canvas */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 rounded-lg min-h-[400px] transition-all duration-300 ${
                  isDraggingOver
                    ? "border-green-400 bg-green-50"
                    : "border-gray-200 bg-white"
                }`}
              >
  {/* 🔥 AGGIUNGI QUESTO: Banner per template predefiniti */}
  {canvasBlocks.length > 0 && canvasBlocks[0].id === 'predefined-template' && (
    <div className="m-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-xl shadow-sm">
      <div className="flex items-start gap-3">
        <div className="text-3xl">📄</div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-900 mb-1">Template Predefinito Caricato</h4>
          <p className="text-sm text-gray-600 mb-3">
            Questo template è stato importato come un unico blocco. Convertilo in blocchi separati per modificarlo facilmente, oppure modifica l'HTML direttamente.
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={() => {
                // Converti il template in blocchi separati
                const parser = new DOMParser();
                const doc = parser.parseFromString(canvasBlocks[0].html, 'text/html');
                const tables = doc.querySelectorAll('table[role="presentation"]');
                
                if (tables.length > 1) {
                  // Template con più sezioni (header, content, footer)
                  const newBlocks = Array.from(tables).map((table, index) => {
                    const html = table.outerHTML;
                    const hasGradient = html.includes('gradient');
                    const hasButton = html.includes('<a');
                    const tdCount = table.querySelectorAll('td[style*="padding"]').length;
                    
                    let name = `Sezione ${index + 1}`;
                    let blockId = 'section-1col';
                    
                    if (hasGradient && index === 0) {
                      name = 'Header';
                      blockId = 'header';
                    } else if (hasButton) {
                      name = 'Call-to-Action';
                    } else if (index === tables.length - 1) {
                      name = 'Footer';
                      blockId = 'footer';
                    } else if (tdCount === 2) {
                      name = 'Sezione 2 Colonne';
                      blockId = 'section-2col';
                    } else if (tdCount === 3) {
                      name = 'Sezione 3 Colonne';
                      blockId = 'section-3col';
                    }
                    
                    return {
                      id: blockId,
                      name: name,
                      icon: '▭',
                      category: 'layout',
                      html: html,
                      instanceId: `converted-${Date.now()}-${index}`
                    };
                  });
                  
                  setCanvasBlocks(newBlocks);
                  // Salva anche i nuovi blocchi
                  sessionStorage.setItem('builderBlocks', JSON.stringify(newBlocks));
                  toast.success('✅ Template convertito in blocchi editabili!');
                } else {
                  toast.error('❌ Questo template non può essere diviso automaticamente');
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Converti in Blocchi Separati
            </button>
            
            <button
              onClick={() => setShowHTMLEditor(!showHTMLEditor)}
              className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition flex items-center gap-2"
            >
              <Code className="w-4 h-4" />
              {showHTMLEditor ? 'Nascondi HTML' : 'Modifica HTML'}
            </button>
          </div>

          {/* Editor HTML (se attivato) */}
          {showHTMLEditor && (
            <div className="mt-4 space-y-2">
              <textarea
                value={canvasBlocks[0].html}
                onChange={(e) => {
                  const updated = [...canvasBlocks];
                  updated[0] = { ...updated[0], html: e.target.value };
                  setCanvasBlocks(updated);
                  sessionStorage.setItem('builderBlocks', JSON.stringify(updated));
                }}
                className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-xs resize-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  toast.success('✅ HTML salvato!');
                  setShowHTMLEditor(false);
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium"
              >
                Salva HTML
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )}

                {/* Se non ci sono blocchi */}
                {canvasBlocks.length === 0 && !isDraggingOver ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Trascina qui i blocchi per iniziare ✨
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                  {canvasBlocks.map((block, index) => (
                    <motion.div
                      key={index}
                      className={`relative group cursor-pointer p-4 transition rounded-lg border ${
                        activeStyleBlock?.index === index
                          ? "border-green-500 bg-green-50"
                          : "border-transparent hover:border-green-200"
                      }`}
                      style={{ perspective: 800 }}
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left - rect.width / 2;
                        const y = e.clientY - rect.top - rect.height / 2;
                        e.currentTarget.style.transform = `rotateX(${y / 20}deg) rotateY(${x / 20}deg) scale(1.02)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
                      }}
                      onClick={() => {
                        // Imposta blocco attivo per il pannello stile
                        console.log('🖱️ BLOCK CLICKED:', block.name);
                        setActiveStyleBlock({ ...block, index });
                
                        // Inizializza i campi stile con fallback
                        setStyleFields({
                          fontSize: block.style?.fontSize || "16px",
                          textAlign: block.style?.textAlign || "left",
                          color: block.style?.color || "#333333",
                          backgroundColor: block.style?.backgroundColor || "#ffffff",
                          padding: block.style?.padding || "10px",
                          borderRadius: block.style?.borderRadius || "4px",
                          marginTop: block.style?.marginTop || "0px",
                          marginRight: block.style?.marginRight || "0px",
                          marginBottom: block.style?.marginBottom || "0px",
                          marginLeft: block.style?.marginLeft || "0px",
                          fontFamily: block.style?.fontFamily || "Inter",
                          // opzionali per immagini (se vuoi evitare undefined)
                          imgWidth: block.style?.imgWidth || "100%",
                          imgBorderRadius: block.style?.imgBorderRadius || "8px",
                          imgPadding: block.style?.imgPadding || "0px",
                          imgAlign: block.style?.imgAlign || "center",
                          imgBorderWidth: block.style?.imgBorderWidth || "0px",
                          imgBorderColor: block.style?.imgBorderColor || "#000000",
                          imgBorderStyle: block.style?.imgBorderStyle || "none",
                          imgShadow: block.style?.imgShadow || false,
                        });
                
                        // Testo semplice per editing pannello
                        const plain = (block.html || "").replace(/<[^>]+>/g, "");
                        setEditingText(plain);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      
                        console.log('⚡ DOUBLE CLICK on block:', block.id);
                     
                        console.log("BLOCK ID:", block.id);
                        console.log('⚡ DOUBLE CLICK DEBUG:');
  console.log('  - block object:', block);
  console.log('  - block.id:', block.id);
  console.log('  - block.name:', block.name);
  console.log('  - index:', index);

                        // 🔥 Lista dei blocchi singoli
  const singleBlockIds = [
     // Layout
     'section-hero',
     'section-cta',
     'section-imgtext',
     'section-textimg',
     'section-testimonial',
     
     // Base ← AGGIUNGI QUESTI
     'header', 
     'footer',
     'image',
     'text',
     'button',
     'divider',
     'social'
   ];
  
  const isSingleBlock = singleBlockIds.includes(block.id);
  console.log('  - Is in single blocks list?', isSingleBlock);
  console.log('  - Single blocks list:', singleBlockIds);
  
  if (isSingleBlock) {
    console.log('✅ Opening single block modal for:', block.id);
    setBlockEditorRestoreLock(true);
    setEditingSingleBlock({
      ...block,
      index: index
    });
    setShowSingleBlockEditor(true);
    toast.success("✏️ Editor modale aperto!", { duration: 2000 });
    return;
  }

  console.log('❌ Block NOT recognized as single block');
                        // // 🆕 GESTIONE BLOCCHI SINGOLI (Hero, Header, Footer) - PRIMA DI TUTTO
                        // if (block.id === 'section-hero' || block.id === 'header' || block.id === 'footer') {
                        //   console.log('🎨 Apertura editor blocco singolo');
                        //   // 🔥 Imposta il lock PRIMA di aprire il modal
                        //   setBlockEditorRestoreLock(true);
                        //   setEditingSingleBlock({
                        //     ...block,
                        //     index: index
                        //   });
                        //   setShowSingleBlockEditor(true);
                        //   toast.success("✏️ Editor aperto!", { duration: 2000 });
                        //   return; // ← IMPORTANTE: esci subito
                        // }
                        
                        // 🆕 GESTIONE SEZIONI MULTI-COLONNA (section-2col, section-3col, ecc.)
                        if (block.id.startsWith('section-')) {
                          // Conta le colonne nella sezione
                          const colCount = (block.html.match(/<td[^>]*style="[^"]*padding:[^"]*">/g) || []).length;
                          console.log('🎨 AMulticolonna');
                          toast.custom((t) => (
                            <div className="bg-blue-500 text-white p-4 rounded-lg shadow-lg">
                              <p className="font-semibold mb-2">📐 Sezione Multi-Colonna</p>
                              <p className="text-sm opacity-90">
                                {colCount} colonne rilevate. Usa il pannello Stili per personalizzare ciascuna colonna.
                              </p>
                            </div>
                          ), { duration: 3000 });
                          
                          // Imposta il blocco attivo con informazione sul numero di colonne
                          setActiveStyleBlock({ ...block, index, columnCount: colCount });
                          
                          // Inizializza i campi stile
                          setStyleFields({
                            fontSize: block.style?.fontSize || "16px",
                            textAlign: block.style?.textAlign || "left",
                            color: block.style?.color || "#333333",
                            backgroundColor: block.style?.backgroundColor || "#ffffff",
                            padding: block.style?.padding || "10px",
                            borderRadius: block.style?.borderRadius || "4px",
                          });
                          return; // ← ESCI SUBITO
                        }
                      
                        handleInlineStart(block, index);
                       
                      }}
                    >
                     {/* CONTENUTO HTML DEL BLOCCO */}
<div
  dangerouslySetInnerHTML={{ __html: block.html }}
  ref={index === inlineEditing?.index ? editorRef : null}
  // ✅ Disabilita contentEditable per blocchi BASE
  contentEditable={
    index === inlineEditing?.index && 
    !['header', 'footer', 'image', 'text', 'button', 'divider', 'social'].includes(block.id)
  }
  suppressContentEditableWarning={true}
  onInput={(e) => setInlineValue(e.currentTarget.innerHTML)}
  className={`transition outline-none ${
    inlineEditing?.index === index
      ? "ring-4 ring-green-500 ring-offset-2 bg-green-50"
      : ""
  }`}
/>
                
                      {/* ❌ ELIMINA BLOCCO */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCanvasBlocks(canvasBlocks.filter((_, i) => i !== index));
                          toast.success(`🗑️ Blocco "${block.name}" rimosso`);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                
                      {/* 📄 DUPLICA BLOCCO */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const clone = {
                            ...block,
                            id: block.id, // 👈 FONDAMENTALE: garantisce che l’ID non si perda MAI
                            html: block.html,
                            instanceId: `${block.id || "block"}-${Date.now()}`,
                          };
                          
                          const updated = [...canvasBlocks];
                          updated.splice(index + 1, 0, clone);
                          setCanvasBlocks(updated);
                          toast.success("📄 Blocco duplicato!");
                        }}
                        className="absolute top-2 right-10 bg-blue-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                
                      {/* 🟢 BADGE LIVE SUL BLOCCO ATTIVO */}
                      {activeStyleBlock?.index === index && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="absolute -top-2 -right-2 bg-green-600 text-white text-[10px] px-2 py-1 rounded-full shadow-lg animate-pulse"
                        >
                          LIVE 🎨
                        </motion.div>
    )}


                          
                        </motion.div>
                      ))}

                      {/* 🎨 EDITOR BLOCCO SINGOLO (Hero, Header, Footer) */}
                      <AnimatePresence>
  {showSingleBlockEditor && editingSingleBlock && (
    <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999999] p-4"
    onMouseDown={(e) => {
      // ✅ Chiudi SOLO se il click è DIRETTAMENTE sul backdrop
      // NON su textarea o altri elementi interni
      if (e.target === e.currentTarget) {
        setShowSingleBlockEditor(false);
      }
    }}
  >
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 20 }}
      className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()} // ✅ Previeni propagazione al backdrop
    >



        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
{/* 🎨 STYLE PANEL */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

{/* 📋 HEADER EDITOR */}
{editingSingleBlock?.id === "header" && (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">📋 Editor Header</h3>
      
      {/* Titolo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
        <input
          type="text"
          defaultValue={editingSingleBlock.html.match(/<h1[^>]*>(.*?)<\/h1>/)?.[1] || ""}
          onChange={(e) => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = editingSingleBlock.html;
            const h1 = wrapper.querySelector("h1");
            if (h1) h1.textContent = e.target.value;
            setEditingSingleBlock({ ...editingSingleBlock, html: wrapper.innerHTML });
          }}
          className="w-full border rounded-lg p-2"
        />
      </div>

      {/* Sottotitolo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sottotitolo</label>
        <input
          type="text"
          defaultValue={editingSingleBlock.html.match(/<p[^>]*>(.*?)<\/p>/)?.[1] || ""}
          onChange={(e) => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = editingSingleBlock.html;
            const p = wrapper.querySelector("p");
            if (p) p.textContent = e.target.value;
            setEditingSingleBlock({ ...editingSingleBlock, html: wrapper.innerHTML });
          }}
          className="w-full border rounded-lg p-2"
        />
      </div>

      {/* Colore Testo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Colore Testo</label>
        <input
          type="color"
          onChange={(e) => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = editingSingleBlock.html;
            const h1 = wrapper.querySelector("h1");
            const p = wrapper.querySelector("p");
            if (h1) h1.style.color = e.target.value;
            if (p) p.style.color = e.target.value;
            setEditingSingleBlock({ ...editingSingleBlock, html: wrapper.innerHTML });
          }}
          className="w-full h-10 border rounded"
        />
      </div>

      {/* Colore Sfondo / Gradiente */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sfondo / Gradiente</label>
        <input
          type="text"
          placeholder="es: linear-gradient(135deg, #667eea, #764ba2)"
          defaultValue={editingSingleBlock.html.match(/background:\s*([^;]+)/)?.[1] || ""}
          onChange={(e) => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = editingSingleBlock.html;
            const table = wrapper.querySelector("table");
            if (table) table.style.background = e.target.value;
            setEditingSingleBlock({ ...editingSingleBlock, html: wrapper.innerHTML });
          }}
          className="w-full border rounded p-2"
        />
      </div>

      {/* Allineamento */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Allineamento</label>
        <div className="flex gap-2">
          {['left', 'center', 'right'].map(align => (
            <button
              key={align}
              onClick={() => {
                const wrapper = document.createElement("div");
                wrapper.innerHTML = editingSingleBlock.html;
                const td = wrapper.querySelector("td");
                if (td) td.style.textAlign = align;
                setEditingSingleBlock({ ...editingSingleBlock, html: wrapper.innerHTML });
              }}
              className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 rounded transition"
            >
              {align === 'left' ? '⬅️ Sinistra' : align === 'center' ? '↕️ Centro' : '➡️ Destra'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )}

  {/* 🖼️ IMAGE EDITOR */}
  {editingSingleBlock?.id === "image" && (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">🖼️ Editor Immagine</h3>
      
      {/* URL Immagine */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">URL Immagine</label>
        <input
          type="text"
          defaultValue={editingSingleBlock.html.match(/src="([^"]+)"/)?.[1] || ""}
          onChange={(e) => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = editingSingleBlock.html;
            const img = wrapper.querySelector("img");
            if (img) img.src = e.target.value;
            setEditingSingleBlock({ ...editingSingleBlock, html: wrapper.innerHTML });
          }}
          className="w-full border rounded-lg p-2"
        />
      </div>

      {/* Upload Immagine */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Oppure Carica Immagine</label>
        <button
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const wrapper = document.createElement("div");
                  wrapper.innerHTML = editingSingleBlock.html;
                  const img = wrapper.querySelector("img");
                  if (img) img.src = reader.result;
                  setEditingSingleBlock({ ...editingSingleBlock, html: wrapper.innerHTML });
                  toast.success("🖼️ Immagine caricata!");
                };
                reader.readAsDataURL(file);
              }
            };
            input.click();
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition"
        >
          📤 Carica Immagine
        </button>
      </div>

      {/* Border Radius */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Arrotondamento Bordi (0-50px)</label>
        <input
          type="range"
          min="0"
          max="50"
          defaultValue="8"
          onChange={(e) => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = editingSingleBlock.html;
            const img = wrapper.querySelector("img");
            if (img) img.style.borderRadius = `${e.target.value}px`;
            setEditingSingleBlock({ ...editingSingleBlock, html: wrapper.innerHTML });
          }}
          className="w-full"
        />
      </div>

      {/* Larghezza Massima */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Larghezza Massima</label>
        <select
          onChange={(e) => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = editingSingleBlock.html;
            const img = wrapper.querySelector("img");
            if (img) img.style.maxWidth = e.target.value;
            setEditingSingleBlock({ ...editingSingleBlock, html: wrapper.innerHTML });
          }}
          className="w-full border rounded p-2"
        >
          <option value="100%">100% (Full Width)</option>
          <option value="80%">80%</option>
          <option value="60%">60%</option>
          <option value="50%">50%</option>
          <option value="400px">400px</option>
          <option value="300px">300px</option>
        </select>
      </div>
    </div>
  )}

  {/* 📝 TEXT EDITOR */}
  {editingSingleBlock?.id === "text" && (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">📝 Editor Paragrafo</h3>
      
      {/* Titolo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
        <input
          type="text"
          defaultValue={editingSingleBlock.html.match(/<h3[^>]*>(.*?)<\/h3>/)?.[1] || ""}
          onChange={(e) => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = editingSingleBlock.html;
            const h3 = wrapper.querySelector("h3");
            if (h3) h3.textContent = e.target.value;
            setEditingSingleBlock({ ...editingSingleBlock, html: wrapper.innerHTML });
          }}
          className="w-full border rounded-lg p-2"
        />
      </div>

      {/* Testo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Testo</label>
        <textarea
          defaultValue={editingSingleBlock.html.match(/<p[^>]*>(.*?)<\/p>/)?.[1] || ""}
          onChange={(e) => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = editingSingleBlock.html;
            const p = wrapper.querySelector("p");
            if (p) p.innerHTML = e.target.value.replace(/\n/g, '<br>');
            setEditingSingleBlock({ ...editingSingleBlock, html: wrapper.innerHTML });
          }}
          className="w-full border rounded-lg p-2 h-32"
        />
      </div>

      {/* Colore Testo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Colore Testo</label>
        <input
          type="color"
          onChange={(e) => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = editingSingleBlock.html;
            const p = wrapper.querySelector("p");
            const h3 = wrapper.querySelector("h3");
            if (p) p.style.color = e.target.value;
            if (h3) h3.style.color = e.target.value;
            setEditingSingleBlock({ ...editingSingleBlock, html: wrapper.innerHTML });
          }}
          className="w-full h-10 border rounded"
        />
      </div>

      {/* Dimensione Font */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Dimensione Testo</label>
        <input
          type="range"
          min="12"
          max="24"
          defaultValue="16"
          onChange={(e) => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = editingSingleBlock.html;
            const p = wrapper.querySelector("p");
            if (p) p.style.fontSize = `${e.target.value}px`;
            setEditingSingleBlock({ ...editingSingleBlock, html: wrapper.innerHTML });
          }}
          className="w-full"
        />
      </div>
    </div>
  )}

  {/* 🔘 BUTTON EDITOR */}
  {editingSingleBlock?.id === "button" && (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">🔘 Editor Pulsante</h3>
      
      {/* Testo Prima del Pulsante */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Testo Descrittivo (opzionale)</label>
        <input
          type="text"
          defaultValue={editingSingleBlock.html.match(/<p[^>]*>(.*?)<\/p>/)?.[1] || ""}
          onChange={(e) => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = editingSingleBlock.html;
            const p = wrapper.querySelector("p");
            if (p) p.textContent = e.target.value;
            setEditingSingleBlock({ ...editingSingleBlock, html: wrapper.innerHTML });
          }}
          className="w-full border rounded-lg p-2"
        />
      </div>

      {/* Testo Pulsante */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Testo Pulsante</label>
        <input
          type="text"
          defaultValue={editingSingleBlock.html.match(/<a[^>]*>(.*?)<\/a>/)?.[1] || ""}
          onChange={(e) => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = editingSingleBlock.html;
            const a = wrapper.querySelector("a");
            if (a) a.textContent = e.target.value;
            setEditingSingleBlock({ ...editingSingleBlock, html: wrapper.innerHTML });
          }}
          className="w-full border rounded-lg p-2"
        />
      </div>

      {/* Link */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Link (href)</label>
        <input
          type="text"
          defaultValue={editingSingleBlock.html.match(/href="([^"]+)"/)?.[1] || "#"}
          onChange={(e) => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = editingSingleBlock.html;
            const a = wrapper.querySelector("a");
            if (a) a.href = e.target.value;
            setEditingSingleBlock({ ...editingSingleBlock, html: wrapper.innerHTML });
          }}
          className="w-full border rounded-lg p-2"
        />
      </div>

      {/* Colore Pulsante */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Colore Pulsante</label>
        <input
          type="color"
          defaultValue="#667eea"
          onChange={(e) => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = editingSingleBlock.html;
            const a = wrapper.querySelector("a");
            if (a) a.style.background = e.target.value;
            setEditingSingleBlock({ ...editingSingleBlock, html: wrapper.innerHTML });
          }}
          className="w-full h-10 border rounded"
        />
      </div>

      {/* Colore Testo Pulsante */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Colore Testo</label>
        <input
          type="color"
          defaultValue="#ffffff"
          onChange={(e) => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = editingSingleBlock.html;
            const a = wrapper.querySelector("a");
            if (a) a.style.color = e.target.value;
            setEditingSingleBlock({ ...editingSingleBlock, html: wrapper.innerHTML });
          }}
          className="w-full h-10 border rounded"
        />
      </div>
    </div>
  )}

  {/* 📱 SOCIAL MEDIA EDITOR */}
  {editingSingleBlock?.id === "social" && (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">📱 Editor Social Media</h3>
      
      <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
        💡 Modifica i link dei social network. I link vengono aggiornati automaticamente.
      </p>

      {/* Testo Introduttivo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Testo Introduttivo</label>
        <input
          type="text"
          defaultValue={editingSingleBlock.html.match(/<p[^>]*>(.*?)<\/p>/)?.[1] || ""}
          onChange={(e) => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = editingSingleBlock.html;
            const p = wrapper.querySelector("p");
            if (p) p.textContent = e.target.value;
            setEditingSingleBlock({ ...editingSingleBlock, html: wrapper.innerHTML });
          }}
          className="w-full border rounded-lg p-2"
        />
      </div>

      {['Facebook', 'Twitter', 'Instagram', 'LinkedIn'].map((social) => (
        <div key={social}>
          <label className="block text-sm font-medium text-gray-700 mb-1">Link {social}</label>
          <input
            type="text"
            placeholder={`https://${social.toLowerCase()}.com/tuoaccount`}
            onChange={(e) => {
              const wrapper = document.createElement("div");
              wrapper.innerHTML = editingSingleBlock.html;
              const links = wrapper.querySelectorAll("a");
              links.forEach(link => {
                if (link.textContent.includes(social)) {
                  link.href = e.target.value;
                }
              });
              setEditingSingleBlock({ ...editingSingleBlock, html: wrapper.innerHTML });
            }}
            className="w-full border rounded-lg p-2"
          />
        </div>
      ))}
    </div>
  )}

  {/* 📄 FOOTER EDITOR */}
  {editingSingleBlock?.id === "footer" && (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">📄 Editor Footer</h3>
      
      {/* Nome Azienda */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Azienda</label>
        <input
          type="text"
          defaultValue={editingSingleBlock.html.match(/<p[^>]*>([^<]+)<\/p>/)?.[1] || ""}
          onChange={(e) => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = editingSingleBlock.html;
            const paragraphs = wrapper.querySelectorAll("p");
            if (paragraphs[0]) paragraphs[0].textContent = e.target.value;
            setEditingSingleBlock({ ...editingSingleBlock, html: wrapper.innerHTML });
          }}
          className="w-full border rounded-lg p-2"
        />
      </div>

      {/* Indirizzo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo e Contatti</label>
        <textarea
          placeholder="Via Esempio 123, 20100 Milano&#10;info@tuaazienda.com | +39 02 1234567"
          onChange={(e) => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = editingSingleBlock.html;
            const paragraphs = wrapper.querySelectorAll("p");
            if (paragraphs[1]) {
              paragraphs[1].innerHTML = e.target.value.split('\n').join('<br>');
            }
            setEditingSingleBlock({ ...editingSingleBlock, html: wrapper.innerHTML });
          }}
          className="w-full border rounded-lg p-2 h-24"
        />
      </div>

      {/* Copyright */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Testo Copyright</label>
        <input
          type="text"
          defaultValue="La Tua Azienda. Tutti i diritti riservati."
          onChange={(e) => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = editingSingleBlock.html;
            const paragraphs = wrapper.querySelectorAll("p");
            const lastP = paragraphs[paragraphs.length - 1];
            if (lastP) {
              lastP.textContent = `© ${new Date().getFullYear()} ${e.target.value}`;
            }
            setEditingSingleBlock({ ...editingSingleBlock, html: wrapper.innerHTML });
          }}
          className="w-full border rounded-lg p-2"
        />
      </div>

      {/* Colore Sfondo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Colore Sfondo</label>
        <input
          type="color"
          defaultValue="#2d3748"
          onChange={(e) => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = editingSingleBlock.html;
            const table = wrapper.querySelector("table");
            if (table) table.style.background = e.target.value;
            setEditingSingleBlock({ ...editingSingleBlock, html: wrapper.innerHTML });
          }}
          className="w-full h-10 border rounded"
        />
      </div>

      {/* Colore Testo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Colore Testo</label>
        <input
          type="color"
          defaultValue="#ffffff"
          onChange={(e) => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = editingSingleBlock.html;
            const paragraphs = wrapper.querySelectorAll("p");
            paragraphs.forEach(p => p.style.color = e.target.value);
            setEditingSingleBlock({ ...editingSingleBlock, html: wrapper.innerHTML });
          }}
          className="w-full h-10 border rounded"
        />
      </div>
    </div>
  )}

</div>


{/* 🔧 HTML MANUAL EDITOR */}
<div className="mt-6">
{/* 📝 TEXT CONTENT EDITOR */}
<div className="mt-6 p-4 border rounded-lg bg-gray-50 space-y-4">
  <h3 className="text-lg font-semibold text-gray-800 mb-2">Contenuto Testo</h3>

  {/* Titolo */}
  <div>
    <label className="block text-sm font-medium text-gray-700">Titolo</label>
    <input
      type="text"
      defaultValue={parseHeroContent().title}
      onChange={(e) => updateHeroContent("title", e.target.value)}
      className="w-full border rounded-lg p-2"
    />
  </div>

  {/* Sottotitolo */}
  <div>
    <label className="block text-sm font-medium text-gray-700">Sottotitolo</label>
    <textarea
      defaultValue={parseHeroContent().subtitle}
      onChange={(e) => updateHeroContent("subtitle", e.target.value)}
      className="w-full border rounded-lg p-2 h-20"
    />
  </div>

  {/* Testo Pulsante */}
  {editingSingleBlock.html.includes("<a") || editingSingleBlock.html.includes("<button") ? (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700">Testo Pulsante</label>
        <input
          type="text"
          defaultValue={parseHeroContent().buttonText}
          onChange={(e) => updateHeroContent("buttonText", e.target.value)}
          className="w-full border rounded-lg p-2"
        />
      </div>

      {/* Link Pulsante */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Link Pulsante (href)</label>
        <input
          type="text"
          defaultValue={parseHeroContent().buttonLink}
          onChange={(e) => updateHeroContent("buttonLink", e.target.value)}
          className="w-full border rounded-lg p-2"
        />
      </div>
    </>
  ) : null}
</div>


{/* 🔧 HTML MANUAL EDITOR */}
<div className="mt-6">
  <label className="block text-sm font-medium text-gray-700 mb-2">Codice HTML (Avanzato)</label>
  <textarea
    value={editingSingleBlock.html}
    onChange={(e) =>
      setEditingSingleBlock({ ...editingSingleBlock, html: e.target.value })
    }
    className="w-full h-40 p-4 border rounded font-mono text-sm"
  />
</div>

{/* 🔍 Preview aggiornato */}
<div className="mt-6">
  <label className="block text-sm font-medium text-gray-700 mb-1">Anteprima</label>
  <div className="border rounded p-4 bg-gray-50">
    <div dangerouslySetInnerHTML={{ __html: editingSingleBlock.html }} />
  </div>
</div>

</div>
{editingSingleBlock?.id === "image" && (
  <div className="mt-6 p-4 border rounded bg-gray-50 space-y-4">
    <h3 className="font-semibold text-gray-800">Immagine</h3>

    <label>URL immagine2</label>
    <input
      className="w-full border rounded p-2"
      defaultValue={parseImageBlock(editingSingleBlock.html).src}
      onChange={(e) => updateImageBlock("src", e.target.value)}
    />

    <label>Border Radius</label>
    <input
      className="w-full border rounded p-2"
      defaultValue={parseImageBlock(editingSingleBlock.html).borderRadius}
      onChange={(e) => updateImageBlock("borderRadius", e.target.value)}
    />
  </div>
)}
{editingSingleBlock?.id === "text" && (
  <div className="mt-6 p-4 border rounded bg-gray-50 space-y-4">
    <h3 className="font-semibold text-gray-800">Paragrafo</h3>

    <label>Testo</label>
    <textarea
      className="w-full border rounded p-2 h-28"
      defaultValue={parseTextBlock(editingSingleBlock.html).text}
      onChange={(e) => updateTextBlock("text", e.target.value)}
    />

    <label>Colore</label>
    <input
      type="color"
      className="w-full h-10 border rounded"
      onChange={(e) => updateTextBlock("color", e.target.value)}
    />
  </div>
)}
{editingSingleBlock?.id === "button" && (
  <div className="mt-6 p-4 border rounded bg-gray-50 space-y-4">
    <h3 className="font-semibold text-gray-800">Pulsante</h3>

    <label>Testo</label>
    <input
      className="w-full border rounded p-2"
      defaultValue={parseButtonBlock(editingSingleBlock.html).text}
      onChange={(e) => updateButtonBlock("text", e.target.value)}
    />

    <label>Link</label>
    <input
      className="w-full border rounded p-2"
      defaultValue={parseButtonBlock(editingSingleBlock.html).link}
      onChange={(e) => updateButtonBlock("link", e.target.value)}
    />

    <label>Colore Sfondo</label>
    <input
      type="color"
      className="w-full h-10 border rounded"
      onChange={(e) => updateButtonBlock("bg", e.target.value)}
    />
  </div>
)}

{/* 📝 CTA Editor */}
{editingSingleBlock?.id === "section-cta" && (
  <div className="mt-6 p-4 border rounded-lg bg-gray-50 space-y-6">
    
    <h3 className="text-lg font-semibold text-gray-800 mb-2">
      Call To Action – Contenuto e Stile
    </h3>

    {/* 🟣 Testo */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Titolo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
        <input
          type="text"
          defaultValue={parseCTAContent().title}
          onChange={(e) => updateCTAContent("title", e.target.value)}
          className="w-full border rounded-lg p-2"
        />
      </div>

      {/* Sottotitolo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sottotitolo</label>
        <textarea
          defaultValue={parseCTAContent().subtitle}
          onChange={(e) => updateCTAContent("subtitle", e.target.value)}
          className="w-full border rounded-lg p-2 h-20"
        />
      </div>

      {/* Testo Pulsante */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Testo Pulsante</label>
        <input
          type="text"
          defaultValue={parseCTAContent().buttonText}
          onChange={(e) => updateCTAContent("buttonText", e.target.value)}
          className="w-full border rounded-lg p-2"
        />
      </div>

      {/* Link pulsante */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Link Pulsante</label>
        <input
          type="text"
          defaultValue={parseCTAContent().buttonLink}
          onChange={(e) => updateCTAContent("buttonLink", e.target.value)}
          className="w-full border rounded-lg p-2"
        />
      </div>
    </div>

    {/* 🎨 COLORI TESTO */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Colore Titolo</label>
        <input type="color" className="w-full h-10 border rounded"
          onChange={(e) => updateCTAColor("titleColor", e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Colore Sottotitolo</label>
        <input type="color" className="w-full h-10 border rounded"
          onChange={(e) => updateCTAColor("subtitleColor", e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Colore Testo Pulsante</label>
        <input type="color" className="w-full h-10 border rounded"
          onChange={(e) => updateCTAColor("buttonTextColor", e.target.value)}
        />
      </div>
    </div>

    {/* 🌈 GRADIENT PICKER */}
    <div>
      <label className="text-sm font-medium text-gray-700 mb-2 block">
        Sfondo (Gradient)
      </label>
      <div className="grid grid-cols-2 gap-4">
        <input type="color" className="h-10 w-full border rounded"
          onChange={(e) => updateCTAGradient(e.target.value, "#f5576c")}
        />
        <input type="color" className="h-10 w-full border rounded"
          onChange={(e) => updateCTAGradient("#f093fb", e.target.value)}
        />
      </div>
    </div>

    {/* 🎨 Gradient Avanzato */}
<div className="space-y-3">
  <label className="font-medium text-gray-700">Gradient Background</label>

  {/* Angolo */}
  <div>
    <label className="text-xs">Angolo (0–360°)</label>
    <input
      type="range"
      min="0"
      max="360"
      onChange={(e) =>
        updateCTAGradientAdvanced({
          angle: e.target.value,
          color1: gradientColor1,
          color2: gradientColor2,
        })
      }
      className="w-full"
    />
  </div>

  {/* Colori */}
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="text-xs">Colore 1</label>
      <input
        type="color"
        onChange={(e) => {
          setGradientColor1(e.target.value);
          updateCTAGradientAdvanced({
            angle: 135,
            color1: e.target.value,
            color2: gradientColor2,
          });
        }}
        className="w-full h-10 border rounded"
      />
    </div>

    <div>
      <label className="text-xs">Colore 2</label>
      <input
        type="color"
        onChange={(e) => {
          setGradientColor2(e.target.value);
          updateCTAGradientAdvanced({
            angle: 135,
            color2: e.target.value,
            color1: gradientColor1,
          });
        }}
        className="w-full h-10 border rounded"
      />
    </div>
  </div>
</div>


    {/* 🔘 BUTTON STYLES */}
    <div className="space-y-3">

      <label className="font-medium text-gray-700">Stile Pulsante</label>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-xs block">Colore BG</label>
          <input type="color" className="w-full h-10 border rounded"
            onChange={(e) => updateCTAButtonStyle("bg", e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs block">Font Size</label>
          <input type="number" min="10" max="30"
            onChange={(e) => updateCTAFontSize("button", e.target.value)}
            className="w-full border rounded p-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs block">Raggio</label>
          <input type="number" min="0" max="60"
            onChange={(e) => updateCTAButtonStyle("radius", e.target.value)}
            className="w-full border rounded p-2 text-sm"
          />
        </div>
      </div>

      {/* Shadow */}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox"
          onChange={(e) => updateCTAButtonStyle("shadow", e.target.checked)}
        />
        Ombreggiatura Pulsante
      </label>
    </div>

    {/* 🅰 FONT SIZES */}
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="text-xs block">Font Titolo</label>
        <input type="number" min="18" max="45"
          onChange={(e) => updateCTAFontSize("title", e.target.value)}
          className="w-full border rounded p-2 text-sm"
        />
      </div>

      <div>
        <label className="text-xs block">Font Sottotitolo</label>
        <input type="number" min="12" max="25"
          onChange={(e) => updateCTAFontSize("subtitle", e.target.value)}
          className="w-full border rounded p-2 text-sm"
        />
      </div>
    </div>

  </div>
)}


{/* 🔍 Preview aggiornato */}
{/* <div className="mt-6">
<label className="block text-sm font-medium text-gray-700 mb-1">Anteprima</label>
<div className="border rounded p-4 bg-gray-50">
  <div dangerouslySetInnerHTML={{ __html: editingSingleBlock.html }} />
</div>
</div> */}

          {/* Preview */}
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Anteprima
            </label>
            <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 overflow-auto">
              <div dangerouslySetInnerHTML={{ __html: editingSingleBlock.html }} />
            </div>
          </div> */}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3">
          <button
            onClick={() => setShowSingleBlockEditor(false)}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium transition"
          >
            Annulla
          </button>
          <button
            onClick={() => {
              const updated = [...canvasBlocks];
              updated[editingSingleBlock.index] = {
                ...updated[editingSingleBlock.index],
                html: editingSingleBlock.html
              };
              setCanvasBlocks(updated);
              setShowSingleBlockEditor(false);
              toast.success("✅ Blocco aggiornato!");
            }}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition"
          >
            Salva Modifiche
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

                   {/* ✏️ Modifica contenuto testo */}
{activeStyleBlock?.id !== "image" && activeStyleBlock?.id !== "button" && (
  <div>
    <label className="block font-medium text-gray-700 mb-1">
      Contenuto Testo
    </label>

    {/* 🆕 SE È UNA SEZIONE MULTI-COLONNA */}
    {activeStyleBlock?.id?.startsWith('section-') ? (
      <div className="space-y-4">
        <p className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
          📐 Sezione con {activeStyleBlock.columnCount || 1} colonna/e rilevata.
          <br />
          <strong>Doppio click</strong> sul blocco per modificare il testo inline.
        </p>

        {/* Preview contenuto attuale */}
        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-40 overflow-y-auto">
          <div 
            dangerouslySetInnerHTML={{ __html: activeStyleBlock.html }}
            className="text-xs"
          />
        </div>

    {/* Pulsante per aprire editor avanzato */}
<div className="flex gap-2">
<button
  onClick={(e) => {
    e.stopPropagation();
    
    console.log('🚀 Opening advanced editor');
    console.log('activeStyleBlock:', activeStyleBlock); // ← Usa questo
    
    // 🔥 Verifica che activeStyleBlock esista
    if (!activeStyleBlock) {
      toast.error('⚠️ Nessun blocco selezionato. Clicca prima sul blocco da modificare.', { duration: 3000 });
      return;
    }
    
    // Usa activeStyleBlock invece di block
    if (
      [
        'section-1col',
        'section-2col',
        'section-3col',
        'section-hero',
        'header',
        'footer',
        'section-testimonial',
        'section-cta',
        // 🧩 Aggiunta dei BASIC BLOCK
        'image',
        'text',
        'button',
        'divider',
        'social'
      ].includes(activeStyleBlock.id)
    ) {
      setEditingSingleBlock({ ...activeStyleBlock, index: activeStyleBlock.index });
      setShowSingleBlockEditor(true);
      toast.success("✏️ Editor aperto!", { duration: 2000 });
      return;
    }
    
    const { columns, styles } = extractColumnsFromSection(activeStyleBlock.html); // ← activeStyleBlock
    
    if (!columns || columns.length <= 1) {
      toast.error('⚠️ Questa sezione non ha colonne multiple da modificare', { duration: 3000 });
      return;
    }
    
    setEditingSectionData({
      blockIndex: activeStyleBlock.index, // ← activeStyleBlock
      originalHTML: activeStyleBlock.html, // ← activeStyleBlock
      columns: columns,
      blockId: activeStyleBlock.id // ← activeStyleBlock
    });
    setColumnStyles(styles);
    setShowSectionEditor(true);
    
    toast.success("📝 Editor sezione aperto!", { duration: 2000 });
  }}
  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
>
  <Edit3 className="w-4 h-4" />
  Editor Avanzato
</button>
  <button
    onClick={() => {
      // Attiva l'inline editor sul blocco
      handleInlineStart(activeStyleBlock, activeStyleBlock.index);
      setActiveStyleBlock(null); // Chiudi pannello stili
      closeEditor(); // ✅ USA closeEditor() invece di setShowSectionEditor(false)
      toast.success("✏️ Click sul testo per modificarlo!", { duration: 2000 });
    }}
    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
  >
    <Type className="w-4 h-4" />
    Inline
  </button>
</div>
      </div>
    ) : (
      /* EDITOR NORMALE PER BLOCCHI SEMPLICI (text, header, footer) */
      <textarea
        className="w-full border border-gray-300 rounded-lg p-2 text-sm h-32 focus:ring-2 focus:ring-green-500"
        value={
          activeStyleBlock?.html
            ? activeStyleBlock.html.replace(/<[^>]+>/g, "")
            : ""
        }
        onChange={(e) => {
          const updatedText = e.target.value;

          const newHTML = `<div style="
            font-size:${styleFields.fontSize};
            text-align:${styleFields.textAlign};
            color:${styleFields.color};
            background-color:${styleFields.backgroundColor};
            padding:${styleFields.padding};
            border-radius:${styleFields.borderRadius};
          ">${updatedText}</div>`;

          if (!activeStyleBlock || activeStyleBlock.index == null) return;

          const updated = [...canvasBlocks];
          updated[activeStyleBlock.index] = {
            ...updated[activeStyleBlock.index],
            html: newHTML,
          };
          setCanvasBlocks(updated);
        }}
      ></textarea>
    )}
  </div>
)}

{/* 📝 MODAL EDITOR AVANZATO COMPLETO */}
{/* 📝 MODAL EDITOR AVANZATO COMPLETO */}
<AnimatePresence>
  {showSectionEditor && editingSectionData && (
   
// Poi modifica il modal overlay:
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
  onMouseDown={(e) => {
    // Salva dove è iniziato il click
    e.currentTarget.dataset.clickStart = e.target === e.currentTarget ? 'overlay' : 'content';
  }}
  onClick={(e) => {
    // Chiudi solo se sia mousedown che mouseup sono sull'overlay
    if (e.target === e.currentTarget && e.currentTarget.dataset.clickStart === 'overlay') {
      // setShowSectionEditor(false);
      closeEditor(); // ✅ USA closeEditor() invece di setShowSectionEditor(false)
    }
    delete e.currentTarget.dataset.clickStart;
  }}
>
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-1 flex items-center gap-2">
                ✏️ Editor Sezione Multi-Colonna
                <span className="text-sm font-normal bg-white/20 px-3 py-1 rounded-full">
                  {editingSectionData.columns.length} colonne
                </span>
              </h3>
              <p className="text-blue-100 text-sm">
                Modifica contenuto, stili, immagini e riordina le colonne
              </p>
            </div>
            <button
              onClick={() => {
                // setShowSectionEditor(false);
                closeEditor(); // ✅ USA closeEditor() invece di setShowSectionEditor(false)
                // setEditingSectionData(null);
                // setColumnStyles({});
              }}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body - Editor Colonne */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="grid grid-cols-1 gap-6">
            {editingSectionData.columns.map((col, colIndex) => (
              <motion.div
                key={colIndex}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: colIndex * 0.1 }}
                className="bg-white rounded-lg border-2 border-gray-200 p-5"
              >
                {/* Header Colonna */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                      {colIndex + 1}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">
                        Colonna {colIndex + 1}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Color Pickers */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      🎨 Sfondo Colonna
                    </label>
                    <input
                      type="color"
                      value={columnStyles[colIndex]?.backgroundColor || '#ffffff'}
                      onChange={(e) => {
                        setColumnStyles({
                          ...columnStyles,
                          [colIndex]: {
                            ...columnStyles[colIndex],
                            backgroundColor: e.target.value
                          }
                        });
                      }}
                      className="w-full h-10 border-2 border-gray-300 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      ✏️ Colore Testo
                    </label>
                    <input
                      type="color"
                      value={columnStyles[colIndex]?.textColor || '#333333'}
                      onChange={(e) => {
                        setColumnStyles({
                          ...columnStyles,
                          [colIndex]: {
                            ...columnStyles[colIndex],
                            textColor: e.target.value
                          }
                        });
                      }}
                      className="w-full h-10 border-2 border-gray-300 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Upload Immagine */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    🖼️ Immagine Colonna
                  </label>
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const newCols = [...editingSectionData.columns];
                            const imgTag = `<img src="${reader.result}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;" alt="Immagine colonna" />`;
                            
                            if (newCols[colIndex].includes('<img')) {
                              newCols[colIndex] = newCols[colIndex].replace(/<img[^>]+>/g, imgTag);
                            } else {
                              newCols[colIndex] = imgTag + newCols[colIndex];
                            }
                            
                            setEditingSectionData({ ...editingSectionData, columns: newCols });
                            
                            setTimeout(() => {
                              const editableDiv = document.querySelector(`div[contentEditable][data-column="${colIndex}"]`);
                              if (editableDiv) {
                                editableDiv.innerHTML = newCols[colIndex];
                              }
                            }, 100);
                            
                            toast.success("🖼️ Immagine aggiunta!", { duration: 2000 });
                          };
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-2 px-4 rounded-lg transition"
                  >
                    Carica Immagine
                  </button>
                </div>

                {/* Toolbar Formattazione */}
                <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-3 mb-3">
                  <div className="flex flex-wrap gap-2">
                   {/* Gruppo 1: Text Style */}
    <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
      <button
        onClick={() => applyFormatting(colIndex, 'bold')}
        className="p-2 hover:bg-white rounded transition text-gray-700 hover:text-blue-600"
        title="Grassetto"
      >
        <strong className="text-sm">B</strong>
      </button>
      
      <button
        onClick={() => applyFormatting(colIndex, 'italic')}
        className="p-2 hover:bg-white rounded transition text-gray-700 hover:text-blue-600"
        title="Corsivo"
      >
        <em className="text-sm">I</em>
      </button>
      
      <button
        onClick={() => applyFormatting(colIndex, 'underline')}
        className="p-2 hover:bg-white rounded transition text-gray-700 hover:text-blue-600"
        title="Sottolineato"
      >
        <u className="text-sm">U</u>
      </button>
      
      <button
        onClick={() => applyFormatting(colIndex, 'strikethrough')}
        className="p-2 hover:bg-white rounded transition text-gray-700 hover:text-blue-600"
        title="Barrato"
      >
        <s className="text-sm">S</s>
      </button>
    </div>
 {/* Gruppo 2: Paragraph Style */}
 <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
      <select
        onChange={(e) => {
          if (e.target.value) {
            applyFormatting(colIndex, 'heading', e.target.value);
            e.target.value = '';
          }
        }}
        className="text-xs border border-gray-300 rounded px-2 py-1.5 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
        defaultValue=""
      >
        <option value="" disabled>Paragrafo</option>
        <option value="p">Normale</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="h4">Heading 4</option>
      </select>
    </div>
 {/* Gruppo 3: Font Size - VERSIONE CORRETTA */}
<div className="flex items-center gap-1 pr-2 border-r border-gray-300">
  <select
    onChange={(e) => {
      if (e.target.value) {
        const div = document.querySelector(`div[contentEditable][data-column="${colIndex}"]`);
        if (div) {
          div.focus();
          
          const selection = window.getSelection();
          if (selection.toString()) {
            // Applica la dimensione al testo selezionato
            applyFormatting(colIndex, 'fontSize', e.target.value);
          } else {
            // Se non c'è testo selezionato, imposta la dimensione per tutto il div
            div.style.fontSize = `${e.target.value}px`;
            
            const newCols = [...editingSectionData.columns];
            newCols[colIndex] = div.innerHTML;
            setEditingSectionData({ ...editingSectionData, columns: newCols });
            
            toast.success(`✨ Dimensione ${e.target.value}px applicata`, { duration: 1500 });
          }
        }
        e.target.value = '';
      }
    }}
    className="text-xs border border-gray-300 rounded px-2 py-1.5 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 outline-none bg-white min-w-[70px]"
    defaultValue=""
  >
    <option value="" disabled>Dimensione</option>
    <option value="8">8px - Tiny</option>
    <option value="10">10px - Small</option>
    <option value="11">11px</option>
    <option value="12">12px</option>
    <option value="13">13px</option>
    <option value="14">14px</option>
    <option value="15">15px</option>
    <option value="16">16px - Normal</option>
    <option value="17">17px</option>
    <option value="18">18px</option>
    <option value="20">20px</option>
    <option value="22">22px</option>
    <option value="24">24px - Large</option>
    <option value="26">26px</option>
    <option value="28">28px</option>
    <option value="30">30px</option>
    <option value="32">32px - XL</option>
    <option value="36">36px</option>
    <option value="40">40px</option>
    <option value="48">48px - XXL</option>
    <option value="56">56px</option>
    <option value="64">64px - Huge</option>
    <option value="72">72px</option>
  </select>
</div>
    {/* Gruppo 4: Text Color & Background */}
<div className="flex items-center gap-1 pr-2 border-r border-gray-300">
  {/* Colore Testo */}
  <div className="relative">
    <button 
      className="p-2 hover:bg-white rounded transition flex items-center gap-1"
      title="Colore testo"
      onClick={() => {
        const input = document.createElement('input');
        input.type = 'color';
        input.value = columnStyles[colIndex]?.textColor || '#333333';
        input.onchange = (e) => {
          applyFormatting(colIndex, 'textColor', e.target.value);
          setColumnStyles({
            ...columnStyles,
            [colIndex]: {
              ...columnStyles[colIndex],
              textColor: e.target.value
            }
          });
        };
        input.click();
      }}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
      <div 
        className="w-3 h-3 rounded border border-gray-300" 
        style={{ backgroundColor: columnStyles[colIndex]?.textColor || '#333333' }}
      />
    </button>
  </div>
     {/* Colore Sfondo */}
  <button
    onClick={() => {
      const input = document.createElement('input');
      input.type = 'color';
      input.value = columnStyles[colIndex]?.backgroundColor || '#ffffff';
      input.onchange = (e) => {
        setColumnStyles({
          ...columnStyles,
          [colIndex]: {
            ...columnStyles[colIndex],
            backgroundColor: e.target.value
          }
        });
      };
      input.click();
    }}
    className="p-2 hover:bg-white rounded transition"
    title="Colore sfondo"
  >
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
    </svg>
  </button>
</div>

    {/* Gruppo 5: Alignment */}
    <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
      <button
        onClick={() => applyFormatting(colIndex, 'align', 'left')}
        className="p-2 hover:bg-white rounded transition text-gray-700 hover:text-blue-600"
        title="Allinea a sinistra"
      >
        <AlignLeft className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => applyFormatting(colIndex, 'align', 'center')}
        className="p-2 hover:bg-white rounded transition text-gray-700 hover:text-blue-600"
        title="Centra"
      >
        <AlignCenter className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => applyFormatting(colIndex, 'align', 'right')}
        className="p-2 hover:bg-white rounded transition text-gray-700 hover:text-blue-600"
        title="Allinea a destra"
      >
        <AlignRight className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => applyFormatting(colIndex, 'align', 'justify')}
        className="p-2 hover:bg-white rounded transition text-gray-700 hover:text-blue-600"
        title="Giustifica"
      >
        <AlignJustify className="w-4 h-4" />
      </button>
    </div>

    {/* Gruppo 6: Lists */}
    <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
      <button
        onClick={() => applyFormatting(colIndex, 'list-ul')}
        className="p-2 hover:bg-white rounded transition text-gray-700 hover:text-blue-600"
        title="Lista puntata"
      >
        <List className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => applyFormatting(colIndex, 'list-ol')}
        className="p-2 hover:bg-white rounded transition text-gray-700 hover:text-blue-600"
        title="Lista numerata"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => document.execCommand('outdent')}
        className="p-2 hover:bg-white rounded transition text-gray-700 hover:text-blue-600"
        title="Riduci rientro"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
        </svg>
      </button>
      
      <button
        onClick={() => document.execCommand('indent')}
        className="p-2 hover:bg-white rounded transition text-gray-700 hover:text-blue-600"
        title="Aumenta rientro"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm6 4a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1zm-6 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
        </svg>
      </button>
    </div>

    {/* Gruppo 7: Insert */}
   {/* Gruppo 7: Insert - AGGIUNGI IL BOTTONE IMMAGINE */}
<div className="flex items-center gap-1">
  <button
    onClick={() => applyFormatting(colIndex, 'link')}
    className="p-2 hover:bg-white rounded transition text-gray-700 hover:text-blue-600"
    title="Inserisci link"
  >
    <LinkIcon className="w-4 h-4" />
  </button>
  
  {/* 🖼️ BOTTONE INSERISCI IMMAGINE */}
  <button
    onClick={() => applyFormatting(colIndex, 'image')}
    className="p-2 hover:bg-white rounded transition text-gray-700 hover:text-blue-600"
    title="Inserisci immagine"
  >
    <ImageIcon className="w-4 h-4" />
  </button>
  
  <button
    onClick={() => {
      const newCols = [...editingSectionData.columns];
      newCols[colIndex] = newCols[colIndex].replace(/<(?!img|br\s*\/?)[^>]+>/g, '');
      setEditingSectionData({ ...editingSectionData, columns: newCols });
      
      setTimeout(() => {
        const editableDiv = document.querySelector(`div[contentEditable][data-column="${colIndex}"]`);
        if (editableDiv) {
          editableDiv.innerHTML = newCols[colIndex];
        }
      }, 100);
      
      toast.success('🧹 Formattazione rimossa', { duration: 1500 });
    }}
    className="p-2 hover:bg-white rounded transition text-gray-700 hover:text-red-600"
    title="Rimuovi formattazione"
  >
    <X className="w-4 h-4" />
  </button>
</div>
                  </div>
                </div>

                {/* ContentEditable Div */}
                {/* ContentEditable Div */}
{/* ContentEditable Div - VERSIONE CON useEffect */}
<div
  ref={(el) => {
    if (el && el.innerHTML !== col && !document.activeElement.contains(el)) {
      el.innerHTML = col;
    }
  }}
  contentEditable
  data-column={colIndex}
  suppressContentEditableWarning
  className="w-full min-h-[100px] p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  style={{
    backgroundColor: columnStyles[colIndex]?.backgroundColor || '#ffffff',
    color: columnStyles[colIndex]?.textColor || '#333333',
    outline: 'none'
  }}
  onInput={(e) => {
    const newCols = [...editingSectionData.columns];
    newCols[colIndex] = e.currentTarget.innerHTML;
    setEditingSectionData({ ...editingSectionData, columns: newCols });
  }}
/>
{/* 🔍 PREVIEW HTML FINALE */}
<details className="mt-3">
  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 font-medium flex items-center gap-2">
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
    </svg>
    Anteprima HTML
  </summary>
  <div className="mt-2 p-3 bg-gray-900 border border-gray-700 rounded-lg text-xs max-h-32 overflow-y-auto">
    <pre className="text-green-400 font-mono whitespace-pre-wrap break-words">
      {col}
    </pre>
  </div>
</details>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer - Azioni */}
        <div className="border-t border-gray-200 p-6 bg-white flex gap-3">
        <button
  onClick={() => {
    const hasChanges = editingSectionData && editingSectionData.columns;
    
    if (hasChanges) {
      setShowUnsavedChangesModal(true);
      return; // Non chiudere ancora
    }
    
    // ✅ USA closeEditor() dal context
    closeEditor();
  }}
  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-6 rounded-lg transition font-medium"
>
  Annulla
</button>
<button
  onClick={() => {
    // 🔥 Aggiorna il blocco nel canvas con le nuove colonne
    if (editingSectionData.blockIndex !== undefined) {
      const updatedBlocks = [...canvasBlocks];
      const blockToUpdate = updatedBlocks[editingSectionData.blockIndex];
      
      if (blockToUpdate) {
        // Ricostruisci l'HTML con le colonne modificate
        // Mantieni la struttura originale ma sostituisci il contenuto delle colonne
        let newHTML = blockToUpdate.html;
        
        // Per ogni colonna, sostituisci il contenuto
        editingSectionData.columns.forEach((col, index) => {
          // Trova e sostituisci il contenuto della colonna nel HTML
          // Questo è un approccio semplificato - potrebbe servire una regex più robusta
          const tdRegex = /<td[^>]*style="padding:[^"]*"[^>]*>([\s\S]*?)<\/td>/g;
          let matchCount = 0;
          
          newHTML = newHTML.replace(tdRegex, (match, content) => {
            if (matchCount === index) {
              matchCount++;
              return match.replace(content, col);
            }
            matchCount++;
            return match;
          });
        });
        
        updatedBlocks[editingSectionData.blockIndex] = {
          ...blockToUpdate,
          html: newHTML
        };
        
        setCanvasBlocks(updatedBlocks);
      }
    }
    
    closeEditor();
    toast.success("✅ Modifiche salvate e applicate al template!", { duration: 2000 });
  }}
  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-lg transition font-medium shadow-lg"
>
  Salva Modifiche
</button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
    

{showUnsavedChangesModal && (
  <AnimatePresence>
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setShowUnsavedChangesModal(false)}
    >
      <motion.div
        className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icona */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        {/* Titolo */}
        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
          Modifiche non salvate
        </h3>

        {/* Messaggio */}
        <p className="text-gray-600 text-center mb-6">
          Ci sono modifiche non salvate nel builder. Vuoi uscire senza salvare?
        </p>

        {/* Pulsanti */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowUnsavedChangesModal(false)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition"
          >
            Annulla
          </button>
          <button
            onClick={() => {
              setShowUnsavedChangesModal(false);
              // 🔥 Qui metti la logica per chiudere/uscire
              handleGoBack(); // o quello che deve fare quando confermi
            }}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition"
          >
            Esci comunque
          </button>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
)}

{socialEditor.open && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl"
    >
      <h3 className="text-lg font-bold mb-4">🔗 Modifica Social Icons</h3>

      <div className="space-y-4">
        {socialEditor.items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 border p-3 rounded-lg">
            <div
              dangerouslySetInnerHTML={{ __html: item.html }}
              className="text-2xl"
            />

            <input
              type="text"
              value={item.href}
              onChange={(e) => {
                const updated = [...socialEditor.items];
                updated[i].href = e.target.value;
                setSocialEditor({ ...socialEditor, items: updated });
              }}
              placeholder="Link social"
              className="flex-1 border rounded px-2 py-1"
            />

            <button
              onClick={() => {
                const filtered = socialEditor.items.filter((_, x) => x !== i);
                setSocialEditor({ ...socialEditor, items: filtered });
              }}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}

        <button
          onClick={() => {
            const updated = [
              ...socialEditor.items,
              { html: "🌐", href: "#" }
            ];
            setSocialEditor({ ...socialEditor, items: updated });
          }}
          className="w-full bg-gray-100 border rounded py-2 hover:bg-gray-200"
        >
          ➕ Aggiungi Social
        </button>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => setSocialEditor({ open: false, index: null, items: [] })}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
        >
          Annulla
        </button>

        <button
          onClick={() => {
            const block = canvasBlocks[socialEditor.index];

            const newHTML =
              `<div style="display:flex; gap:10px; justify-content:center;">` +
              socialEditor.items
                .map((s) => `<a href="${s.href}" target="_blank">${s.html}</a>`)
                .join("") +
              `</div>`;

            const updated = [...canvasBlocks];
            updated[socialEditor.index] = { ...block, html: newHTML };
            setCanvasBlocks(updated);

            setSocialEditor({ open: false, index: null, items: [] });
            toast.success("🔗 Social aggiornati!");
          }}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Salva
        </button>
      </div>
    </motion.div>
  </div>
)}



                       {/* ⚙️ TOOLBAR MODIFICA PULSANTE INLINE */}
    {inlineEditing && inlineEditing.type === "button" && (
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.15 }}
        className="fixed bottom-10 right-10 bg-white shadow-lg border border-gray-200 rounded-lg p-4 z-[9999]"
      >
        <h4 className="font-semibold text-sm mb-2">Modifica Pulsante</h4>
        <input
          type="text"
          placeholder="Testo pulsante"
          onChange={(e) =>
            setInlineValue(inlineValue.replace(/>.*<\/a>/, `>${e.target.value}</a>`))
          }
          className="border border-gray-300 rounded p-2 w-full mb-2 text-sm"
        />
        <input
          type="text"
          placeholder="Link"
          onChange={(e) =>
            setInlineValue(inlineValue.replace(/href="[^"]*"/, `href="${e.target.value}"`))
          }
          className="border border-gray-300 rounded p-2 w-full mb-2 text-sm"
        />
        <input
          type="color"
          onChange={(e) =>
            setInlineValue(inlineValue.replace(/background:[^;"]+/, `background:${e.target.value}`))
          }
          className="h-8 w-8 border rounded"
        />
      </motion.div>
    )}
{/* 🧰 Toolbar testo fluttuante tipo Notion */}
<AnimatePresence>
  {showTextToolbar && (
    <motion.div
      ref={toolbarRef}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ duration: 0.15 }}
      style={{
        position: "fixed",
        top: toolbarPosition.y,
        left: toolbarPosition.x,
        transform: "translate(-50%, -100%)",
      }}
      className="bg-white shadow-xl border border-gray-200 rounded-xl px-4 py-2 flex items-center gap-2 z-[9999]"
    >
      {/* Grassetto */}
      <button
        onClick={() => applyFormat("bold")}
        className="p-2 hover:bg-gray-100 rounded-lg transition group relative"
        title="Grassetto"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
        </svg>
      </button>

      {/* Corsivo */}
      <button
        onClick={() => applyFormat("italic")}
        className="p-2 hover:bg-gray-100 rounded-lg transition italic font-serif text-lg"
        title="Corsivo"
      >
        I
      </button>

      {/* Sottolineato */}
      <button
        onClick={() => applyFormat("underline")}
        className="p-2 hover:bg-gray-100 rounded-lg transition"
        title="Sottolineato"
      >
        <span className="underline font-semibold">U</span>
      </button>

      <div className="w-px h-6 bg-gray-300"></div>

      {/* Link */}
      <button
        onClick={() => setShowLinkModal(true)}
        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition"
        title="Aggiungi link"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </button>

      {/* Colore Testo */}
      <button
        onClick={() => setShowColorPicker(true)}
        className="p-2 hover:bg-gray-100 rounded-lg transition relative"
        title="Colore testo"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white" style={{ background: selectedColor }}></div>
      </button>

      {/* Evidenziazione */}
      <button
        onClick={() => setShowHighlightPicker(true)}
        className="p-2 hover:bg-gray-100 rounded-lg transition relative"
        title="Evidenziazione"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white" style={{ background: selectedHighlight }}></div>
      </button>
    </motion.div>
  )}

  {/* Modal Link */}
  {showLinkModal && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999]"
      onClick={() => setShowLinkModal(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Inserisci Link</h3>
        </div>
        
        <input
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://esempio.com"
          className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 mb-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
          autoFocus
        />
        
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowLinkModal(false);
              setLinkUrl('');
            }}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium transition"
          >
            Annulla
          </button>
          <button
            onClick={() => {
              if (linkUrl) {
                applyFormat("createLink", linkUrl);
                setShowLinkModal(false);
                setLinkUrl('');
              }
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition"
          >
            Inserisci
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}

  {/* Modal Colore Testo */}
  {showColorPicker && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999]"
      onClick={() => setShowColorPicker(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4">Scegli Colore Testo</h3>
        
        {/* Color Picker */}
        <div className="flex gap-3 mb-4">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="w-20 h-20 rounded-lg cursor-pointer border-2 border-gray-200"
          />
          <div className="flex-1">
            <input
              type="text"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 font-mono text-sm mb-2"
              placeholder="#000000"
            />
            <div className="grid grid-cols-6 gap-2">
              {['#000000', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'].map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className="w-8 h-8 rounded-lg border-2 border-gray-200 hover:scale-110 transition"
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowColorPicker(false)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium transition"
          >
            Annulla
          </button>
          <button
            onClick={() => {
              applyFormat("foreColor", selectedColor);
              setShowColorPicker(false);
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition"
          >
            Applica
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}

  {/* Modal Evidenziazione */}
  {showHighlightPicker && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999]"
      onClick={() => setShowHighlightPicker(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4">Scegli Colore Evidenziazione</h3>
        
        <div className="grid grid-cols-4 gap-3 mb-4">
          {['#ffff00', '#fde047', '#fbbf24', '#fb923c', '#f87171', '#c084fc', '#60a5fa', '#4ade80'].map(color => (
            <button
              key={color}
              onClick={() => setSelectedHighlight(color)}
              className={`h-16 rounded-lg border-4 hover:scale-105 transition ${
                selectedHighlight === color ? 'border-gray-900' : 'border-gray-200'
              }`}
              style={{ background: color }}
            />
          ))}
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowHighlightPicker(false)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium transition"
          >
            Annulla
          </button>
          <button
            onClick={() => {
              applyFormat("hiliteColor", selectedHighlight);
              setShowHighlightPicker(false);
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition"
          >
            Applica
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

                  </div>
                  
                )}
<AnimatePresence>
{editingBlock && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-xl relative"
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        ✏️ Modifica blocco: {editingBlock.name}
      </h3>

      {/* === HEADER === */}
      {editingBlock.id === "header" && (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
          <input
            type="text"
            onChange={(e) =>
              setTempFields({ ...tempFields, title: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg p-2 mb-3"
            placeholder="Inserisci titolo..."
          />
          <label className="block text-sm font-medium text-gray-700 mb-1">Colore testo</label>
          <input
            type="color"
            onChange={(e) =>
              setTempFields({ ...tempFields, color: e.target.value })
            }
            className="w-16 h-8 border rounded mb-3"
          />
          <label className="block text-sm font-medium text-gray-700 mb-1">Allineamento</label>
          <div className="flex gap-2 mb-3">
            <button onClick={() => setTempFields({ ...tempFields, align: 'left' })}><AlignLeft /></button>
            <button onClick={() => setTempFields({ ...tempFields, align: 'center' })}><AlignCenter /></button>
            <button onClick={() => setTempFields({ ...tempFields, align: 'right' })}><AlignRight /></button>
          </div>
        </>
      )}

      {/* === IMMAGINE === */}
      {editingBlock.id === "image" && (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL Immagine</label>
          <input
            type="text"
            onChange={(e) =>
              setTempFields({ ...tempFields, image: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg p-2 mb-3"
            placeholder="https://esempio.com/immagine.jpg"
          />
          <label className="block text-sm font-medium text-gray-700 mb-1">Oppure carica immagine</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const url = URL.createObjectURL(file);
                setTempFields({ ...tempFields, image: url });
              }
            }}
            className="block w-full text-sm text-gray-600"
          />
          {tempFields.image && (
            <img
              src={tempFields.image}
              alt="Anteprima"
              className="mt-3 rounded-md shadow max-h-48 mx-auto"
            />
          )}
        </>
      )}

      {/* === TESTO === */}
      {editingBlock.id === "text" && (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contenuto Testo</label>
          <textarea
            rows="5"
            onChange={(e) =>
              setTempFields({ ...tempFields, text: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg p-2 mb-3"
            placeholder="Scrivi qui il tuo testo..."
          />
          <label className="block text-sm font-medium text-gray-700 mb-1">Colore testo</label>
          <input
            type="color"
            onChange={(e) =>
              setTempFields({ ...tempFields, color: e.target.value })
            }
            className="w-16 h-8 border rounded"
          />
        </>
      )}

      {/* === PULSANTE === */}
      {editingBlock.id === "button" && (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-1">Testo pulsante</label>
          <input
            type="text"
            onChange={(e) =>
              setTempFields({ ...tempFields, text: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg p-2 mb-3"
            placeholder="Scopri di più"
          />
          <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
          <input
            type="text"
            onChange={(e) =>
              setTempFields({ ...tempFields, link: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg p-2 mb-3"
            placeholder="https://..."
          />
          <label className="block text-sm font-medium text-gray-700 mb-1">Colore pulsante</label>
          <input
            type="color"
            onChange={(e) =>
              setTempFields({ ...tempFields, color: e.target.value })
            }
            className="w-16 h-8 border rounded"
          />
        </>
      )}

      {/* === SOCIAL === */}
      {editingBlock.id === "social" && (
        <>
          {["Facebook", "Instagram", "Twitter"].map((s) => (
            <div key={s} className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">{s}</label>
              <input
                type="text"
                onChange={(e) =>
                  setTempFields({ ...tempFields, [s.toLowerCase()]: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg p-2"
                placeholder={`URL ${s}`}
              />
            </div>
          ))}
        </>
      )}

      {/* === FOOTER === */}
      {editingBlock.id === "footer" && (
        <>
          <label className="block text-sm font-medium text-gray-700 mb-1">Testo Footer</label>
          <textarea
            rows="3"
            onChange={(e) =>
              setTempFields({ ...tempFields, text: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg p-2 mb-3"
            placeholder="© 2025 La tua azienda. Tutti i diritti riservati."
          />
          <label className="block text-sm font-medium text-gray-700 mb-1">Colore sfondo</label>
          <input
            type="color"
            onChange={(e) =>
              setTempFields({ ...tempFields, bg: e.target.value })
            }
            className="w-16 h-8 border rounded"
          />
        </>
      )}

      {/* === Pulsanti azione === */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => setEditingBlock(null)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
        >
          Annulla
        </button>
        <button
          onClick={() => {
            const updated = [...canvasBlocks];
            let html = editingBlock.html;

            // Applica modifiche base
            if (tempFields.title) html = html.replace(/<h1[^>]*>.*?<\/h1>/, `<h1 style="color:${tempFields.color || '#ffffff'};text-align:${tempFields.align || 'center'}">${tempFields.title}</h1>`);
            if (tempFields.text) html = html.replace(/<p[^>]*>.*?<\/p>/, `<p style="color:${tempFields.color || '#333333'};">${tempFields.text}</p>`);
            if (tempFields.link) html = html.replace(/href="[^"]*"/, `href="${tempFields.link}"`);
            if (tempFields.image) html = html.replace(/<img[^>]+>/, `<img src="${tempFields.image}" style="max-width:100%;border-radius:8px;">`);
            if (tempFields.color && editingBlock.id === "button") html = html.replace(/background:[^;"]+/, `background:${tempFields.color}`);
            if (tempFields.facebook || tempFields.twitter || tempFields.instagram)
              html = `
                <div style="padding:20px;text-align:center;">
                  ${tempFields.facebook ? `<a href="${tempFields.facebook}" style="margin:0 10px;color:#3b5998;">Facebook</a>` : ""}
                  ${tempFields.instagram ? `<a href="${tempFields.instagram}" style="margin:0 10px;color:#e1306c;">Instagram</a>` : ""}
                  ${tempFields.twitter ? `<a href="${tempFields.twitter}" style="margin:0 10px;color:#1DA1F2;">Twitter</a>` : ""}
                </div>
              `;
            if (tempFields.bg && editingBlock.id === "footer")
              html = html.replace(/background:[^;"]+/, `background:${tempFields.bg}`);

            updated[editingBlock.index] = { ...editingBlock, html };
            setCanvasBlocks(updated);
            setEditingBlock(null);
            toast.success("✅ Blocco aggiornato!");
          }}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
        >
          Salva
        </button>
      </div>
    </motion.div>
  </motion.div>
)}
</AnimatePresence>


                {/* Overlay durante drag */}
                {isDraggingOver && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-100/70 border-2 border-dashed border-green-400 rounded-lg text-green-700 font-medium">
                    Rilascia qui 👇
                  </div>
                )}
              </div>
            </div>

            {/* Pulsanti Azione */}
            <div className="flex flex-wrap gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleGoBack}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition"
              >
                ⬅️ Indietro
              </button>

              <button
                onClick={() => setShowTestEmailModal(true)}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                📧 Invia Email di Test
              </button>

              <button
                onClick={handleExportTemplate}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                📤 Esporta Template
              </button>

              <button
  onClick={() => {
    console.log('🔍 DEBUG - INIZIO SALVATAGGIO TEMPLATE');
    console.log('🔍 canvasBlocks:', canvasBlocks);
    
    const templateHTML = canvasBlocks.map(block => block.html).join('\n');
    console.log('📄 Template finale:', templateHTML.substring(0, 200));
    
    // 🔥 PULISCI il vecchio template prima di salvare il nuovo
    sessionStorage.removeItem('currentEmailContent');
    
    // Salva il nuovo template
    sessionStorage.setItem('builderTemplate', templateHTML);
    sessionStorage.setItem('builderBlocks', JSON.stringify(canvasBlocks));
    
    setCampaignMode("normal");
    toast.success("✅ Template salvato!", { duration: 2000 });
  }}
  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition"
>
  ✅ Usa questo Template
</button>
            </div>

          </div>
        </motion.div>
      </div>

      {/* Button Editor (resta uguale) */}
      {editingButton && (
        <ButtonEditor
          buttonText={buttonText}
          setButtonText={setButtonText}
          buttonLink={buttonLink}
          setButtonLink={setButtonLink}
          buttonColor={buttonColor}
          setButtonColor={setButtonColor}
          buttonTextColor={buttonTextColor}
          setButtonTextColor={setButtonTextColor}
          openInNewTab={openInNewTab}
          setOpenInNewTab={setOpenInNewTab}
          buttonAlignment={buttonAlignment}
          setButtonAlignment={setButtonAlignment}
          buttonSize={buttonSize}
          setButtonSize={setButtonSize}
          buttonShape={buttonShape}
          setButtonShape={setButtonShape}
          borderType={borderType}
          setBorderType={setBorderType}
          borderWidth={borderWidth}
          setBorderWidth={setBorderWidth}
          borderColor={borderColor}
          setBorderColor={setBorderColor}
          paddingTop={paddingTop}
          setPaddingTop={setPaddingTop}
          paddingBottom={paddingBottom}
          setPaddingBottom={setPaddingBottom}
          paddingLeft={paddingLeft}
          setPaddingLeft={setPaddingLeft}
          paddingRight={paddingRight}
          setPaddingRight={setPaddingRight}
          applyPaddingAll={applyPaddingAll}
          setApplyPaddingAll={setApplyPaddingAll}
          onSave={handleSaveButton}
          onCancel={() => setEditingButton(false)}
        />
      )}

      {/* 👻 Ghost Block Preview */}
      {ghostBlock && (
        <div
          className="fixed pointer-events-none z-[9999] opacity-90 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            top: ghostPosition.y,
            left: ghostPosition.x,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="bg-white shadow-lg border border-green-400 rounded-lg p-3 min-w-[180px] text-sm"
          >
            <div className="flex items-center gap-2">
              <div className="text-lg">{ghostBlock.icon}</div>
              <span className="font-medium text-gray-800">{ghostBlock.name}</span>
            </div>
          </motion.div>
        </div>
      )}

{/* 📧 MODALE INVIO EMAIL DI TEST */}
{showTestEmailModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          📧 Invia Email di Test
        </h3>
        <button
          onClick={() => setShowTestEmailModal(false)}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Inserisci un indirizzo email per ricevere un’anteprima realistica del template costruito.
      </p>

      {/* INPUT EMAIL */}
      <input
        type="email"
        value={testEmailAddress}
        onChange={(e) => setTestEmailAddress(e.target.value)}
        placeholder="es. nome@email.it"
        className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-green-500 focus:outline-none"
      />

      {/* STATO DARK MODE */}
      <div className="flex items-center justify-end mb-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isDarkMode}
            onChange={() => setIsDarkMode(!isDarkMode)}
            className="hidden"
          />
          <div
            className={`w-10 h-5 rounded-full flex items-center transition-all ${
              isDarkMode ? "bg-gray-800" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                isDarkMode ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </div>
          {isDarkMode ? (
            <span className="flex items-center gap-1 text-gray-700">
              <Moon className="w-4 h-4" /> Scuro
            </span>
          ) : (
            <span className="flex items-center gap-1 text-yellow-500">
              <Sun className="w-4 h-4" /> Chiaro
            </span>
          )}
        </label>
      </div>

      {/* MINI ANTEPRIMA EMAIL */}
      <div
        className={`border rounded-lg overflow-hidden mb-4 ${
          isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
        }`}
      >
        <div
          className={`${
            isDarkMode ? "bg-gray-800 text-gray-200" : "bg-gray-200 text-gray-700"
          } px-3 py-2 border-b text-xs font-medium flex justify-between items-center`}
        >
          <span>📬 Anteprima Template</span>

    {/* 🔹 Pulsanti Azione */}
<div className="flex items-center gap-3 flex-wrap">
  {/* 📋 Copia */}
  <button
    onClick={() => {
      const html = canvasBlocks.length > 0
        ? canvasBlocks.map((b) => b.html).join("")
        : "<p>Nessun contenuto nel template</p>";
      navigator.clipboard.writeText(html);
      toast.success("✅ Template HTML copiato negli appunti!");
    }}
    className="text-blue-500 hover:text-blue-600 text-xs font-semibold flex items-center gap-1"
  >
    <ClipboardCopy className="w-3 h-3" /> Copia
  </button>

  {/* 💾 Scarica */}
  <button
    onClick={() => {
      const html = canvasBlocks.length > 0
        ? canvasBlocks.map((b) => b.html).join("")
        : "<p>Nessun contenuto nel template</p>";
      const blob = new Blob([html], { type: "text/html" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "template-email.html";
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success("💾 Template scaricato come HTML!");
    }}
    className="text-purple-500 hover:text-purple-600 text-xs font-semibold flex items-center gap-1"
  >
    <Download className="w-3 h-3" /> Scarica
  </button>

  {/* 📤 Gmail */}
  <button
    onClick={() => {
      const html = canvasBlocks.map((b) => b.html).join("") || "<p>Nessun contenuto</p>";
      const gmailBody = encodeURIComponent(html);
      const gmailSubject = encodeURIComponent("Anteprima Template Email");
      const gmailTo = encodeURIComponent(testEmailAddress || "");
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${gmailTo}&su=${gmailSubject}&body=${gmailBody}`;
      window.open(gmailUrl, "_blank");
    }}
    className="text-red-500 hover:text-red-600 text-xs font-semibold flex items-center gap-1"
  >
    <Mail className="w-3 h-3" /> Gmail
  </button>

  {/* 💌 Outlook */}
  <button
    onClick={() => {
      const html = canvasBlocks.map((b) => b.html).join("") || "<p>Nessun contenuto</p>";
      const outlookBody = encodeURIComponent(html);
      const outlookSubject = encodeURIComponent("Anteprima Template Email");
      const outlookTo = encodeURIComponent(testEmailAddress || "");
      const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${outlookTo}&subject=${outlookSubject}&body=${outlookBody}`;
      window.open(outlookUrl, "_blank");
    }}
    className="text-sky-600 hover:text-sky-700 text-xs font-semibold flex items-center gap-1"
  >
    <Send className="w-3 h-3" /> Outlook
  </button>

  {/* 🖥️ Mailto */}
  <button
    onClick={() => {
      const html = canvasBlocks.map((b) => b.html).join("") || "<p>Nessun contenuto</p>";
      const subject = encodeURIComponent("Anteprima Template Email");
      const mailTo = encodeURIComponent(testEmailAddress || "");
      const body = encodeURIComponent(
        "Ecco un’anteprima del template:\n\n" + html.replace(/<[^>]+>/g, "")
      );
      const mailtoUrl = `mailto:${mailTo}?subject=${subject}&body=${body}`;
      window.location.href = mailtoUrl;
    }}
    className="text-indigo-500 hover:text-indigo-600 text-xs font-semibold flex items-center gap-1"
  >
    <ExternalLink className="w-3 h-3" /> Mail Predefinita
  </button>

  {/* 🚀 Resend Live Send con Log */}
<button
  onClick={async () => {
    if (!testEmailAddress) {
      toast.error("❌ Inserisci un indirizzo email valido prima di inviare.");
      return;
    }

    const htmlContent =
      canvasBlocks.length > 0
        ? canvasBlocks.map((b) => b.html).join("")
        : "<p>Nessun contenuto nel template</p>";

    toast.loading("📤 Invio email in corso...", { id: "resend-send" });

    const timestamp = new Date().toLocaleString();

    try {
      const response = await fetch("/api/resend/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testEmailAddress,
          subject: "Anteprima Template Email (Live Test)",
          html: htmlContent,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`✅ Email inviata con successo a ${testEmailAddress}`, { id: "resend-send" });
        setResendLog((prev) => [
          {
            id: data.id,
            email: testEmailAddress,
            status: "success",
            message: "Email inviata correttamente",
            timestamp,
          },
          ...prev,
        ]);
        // 💾 Esporta automaticamente il log in CSV (silenzioso)
        if (autoExportLog) {
          setTimeout(() => exportResendLog("csv", true), 1000);
        }
      } else {
        toast.error(`❌ Errore: ${data.error || "Invio fallito"}`, { id: "resend-send" });
        setResendLog((prev) => [
          {
            id: null,
            email: testEmailAddress,
            status: "error",
            message: data.error || "Errore sconosciuto",
            timestamp,
          },
          ...prev,
        ]);
      }
    } catch (error) {
      toast.error("🚨 Errore durante l'invio. Controlla la connessione o la chiave API.", {
        id: "resend-send",
      });
      setResendLog((prev) => [
        {
          id: null,
          email: testEmailAddress,
          status: "error",
          message: error.message,
          timestamp,
        },
        ...prev,
      ]);
    }
  }}
  className="text-green-600 hover:text-green-700 text-xs font-semibold flex items-center gap-1"
>
  <Send className="w-3 h-3" /> Resend API
</button>

  {/* 🌐 Desktop */}
  <button
    onClick={() => {
      const htmlContent = canvasBlocks.length > 0
        ? canvasBlocks.map((b) => b.html).join("")
        : "<div style='text-align:center; color:#999; padding:40px;'>Nessun contenuto 👀</div>";

      const newWindow = window.open("", "_blank", "width=1200,height=900");
      newWindow.document.write(`
        <html>
          <head>
            <title>Anteprima Desktop</title>
            <style>
              body {
                background: ${isDarkMode ? "#111827" : "#f3f4f6"};
                color: ${isDarkMode ? "#e5e7eb" : "#111827"};
                font-family: Arial, sans-serif;
                padding: 40px;
              }
              .email-container {
                max-width: 600px;
                margin: 0 auto;
                background: ${isDarkMode ? "#1f2937" : "#ffffff"};
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                overflow: hidden;
              }
            </style>
          </head>
          <body>
            <div class="email-container">${htmlContent}</div>
          </body>
        </html>
      `);
      newWindow.document.close();
    }}
    className="text-green-500 hover:text-green-600 text-xs font-semibold flex items-center gap-1"
  >
    <ExternalLink className="w-3 h-3" /> Desktop
  </button>

  {/* 📱 Mobile */}
  <button
    onClick={() => {
      const htmlContent = canvasBlocks.length > 0
        ? canvasBlocks.map((b) => b.html).join("")
        : "<div style='text-align:center; color:#999; padding:40px;'>Nessun contenuto 👀</div>";

      const mobileWindow = window.open("", "_blank", "width=400,height=700");
      mobileWindow.document.write(`
        <html>
          <head>
            <title>Anteprima Mobile</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              body {
                background: ${isDarkMode ? "#111827" : "#f3f4f6"};
                color: ${isDarkMode ? "#e5e7eb" : "#111827"};
                display: flex; justify-content: center; align-items: center; height: 100vh;
                font-family: Arial, sans-serif;
              }
              .email-mobile {
                width: 375px;
                background: ${isDarkMode ? "#1f2937" : "#ffffff"};
                border: 1px solid #ddd;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
              }
            </style>
          </head>
          <body>
            <div class="email-mobile">${htmlContent}</div>
          </body>
        </html>
      `);
      mobileWindow.document.close();
    }}
    className="text-orange-500 hover:text-orange-600 text-xs font-semibold flex items-center gap-1"
  >
    <Smartphone className="w-3 h-3" /> Mobile
  </button>
</div>

{/* 🧾 Log Invii */}
{resendLog.length > 0 && (
  <div className="mt-5 bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-72 overflow-y-auto">
    {/* Header log */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-gray-500" />
        <h4 className="text-sm font-semibold text-gray-700">Log invii recenti</h4>
      </div>

      {/* 🔍 Barra ricerca + Filtri */}
      <div className="flex items-center gap-2 flex-wrap">
  <input
    type="text"
    value={logSearch}
    onChange={(e) => setLogSearch(e.target.value)}
    placeholder="Cerca per email o messaggio..."
    className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:ring-1 focus:ring-green-500 outline-none"
  />

<select
    value={logFilter}
    onChange={(e) => setLogFilter(e.target.value)}
    className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:ring-1 focus:ring-green-500 outline-none"
  >
          <option value="all">Tutti</option>
          <option value="success">✅ Solo inviati</option>
          <option value="error">❌ Solo errori</option>
        </select>

        <button
    onClick={() => {
      setResendLog([]);
      toast.custom((t) => (
        <div className="bg-blue-500 text-white p-3 rounded shadow">
          🗑️ Blocco "{block.name}" 🧹 Log svuotato
        </div>
      ));
      // toast("🧹 Log svuotato");
    }}
    className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 transition"
  >
    <Trash2 className="w-3 h-3" /> Pulisci log
  </button>
  {/* 📤 Esporta Log */}
  <div className="flex items-center gap-1">
    <button
      onClick={() => exportResendLog("csv")}
      className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1 transition"
    >
      <Download className="w-3 h-3" /> CSV
    </button>
    <button
      onClick={() => exportResendLog("txt")}
      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
    >
      <FileText className="w-3 h-3" /> TXT
    </button>
    {/* 💾 Toggle */}
  <label className="flex items-center gap-1 text-xs text-gray-600 select-none cursor-pointer">
    <input
      type="checkbox"
      checked={autoExportLog}
      onChange={(e) => setAutoExportLog(e.target.checked)}
      className="accent-green-600 cursor-pointer"
    />
    Esporta automaticamente
  </label>
  {/* ⚙️ Pulsante Rotella Animata */}
<motion.button
  onClick={() => setShowExportSettings(true)}
  className="absolute top-4 right-4 bg-white shadow-md border border-gray-200 rounded-full p-2 hover:bg-green-50 group"
  // whileHover={{ rotate: 90, scale: 1.1 }}
  whileTap={{ scale: 0.95 }}
  title="Impostazioni esportazione log"
>
  <Settings className="w-5 h-5 text-gray-600 group-hover:text-green-600 transition-colors" />
</motion.button>
  </div>
      </div>
    </div>

    {/* 🔎 Lista filtrata */}
    <ul className="space-y-2 text-xs">
      {resendLog
        .filter((log) => {
          if (logFilter === "success" && log.status !== "success") return false;
          if (logFilter === "error" && log.status !== "error") return false;
          if (
            logSearch &&
            !`${log.email} ${log.message}`
              .toLowerCase()
              .includes(logSearch.toLowerCase())
          )
            return false;
          return true;
        })
        .map((log, i) => (
          <li
            key={i}
            className={`flex justify-between items-start p-2 rounded-md ${
              log.status === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="max-w-[85%]">
              <p className="font-medium text-gray-800 truncate">{log.email}</p>
              <p className="text-gray-600 break-words">{log.message}</p>
              <p className="text-[10px] text-gray-400 mt-1">{log.timestamp}</p>
            </div>
            {log.status === "success" ? (
              <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500 mt-1" />
            )}
          </li>
        ))}
    </ul>
  </div>
)}



        </div>

        {/* 📩 Layout Email */}
        <div
          className={`p-6 flex justify-center transition-all duration-300 ${
            isDarkMode ? "bg-gray-900" : "bg-gray-50"
          }`}
        >
          <div
            className={`shadow-md rounded-lg w-full max-w-[600px] min-h-[400px] border overflow-hidden transition-all ${
              isDarkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-gray-200 text-gray-900"
            }`}
          >
            <div
              className={`text-xs px-4 py-2 border-b flex justify-between ${
                isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-200"
              }`}
            >
              <span>Da: <strong>{localStorage.getItem("resend_sender_email") || "Mittente Configurato"}</strong></span>
              <span>A: <strong>{testEmailAddress || "tu@esempio.it"}</strong></span>
            </div>

            <div
              className="p-6 max-h-[400px] overflow-y-auto"
              dangerouslySetInnerHTML={{
                __html:
                  canvasBlocks.length > 0
                    ? canvasBlocks.map((b) => b.html).join("")
                    : `<div style="text-align:center; color:#999; padding:40px;">Nessun contenuto 👀</div>`,
              }}
            />
          </div>
        </div>
      </div>

      {/* PULSANTI AZIONE */}
      <div className="flex gap-3 justify-end mt-4">
        <button
          onClick={() => setShowTestEmailModal(false)}
          className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
        >
          Annulla
        </button>
        <button
          onClick={handleSendTestEmail}
          disabled={sendingTestEmail}
          className={`px-4 py-2 rounded-lg text-white transition flex items-center justify-center gap-2 ${
            sendingTestEmail
              ? "bg-green-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {sendingTestEmail ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Invio in corso...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" /> Invia Test
            </>
          )}
        </button>
      </div>
    </motion.div>
  </div>
)}



    </>
  );
}


  // FORM PRINCIPALE CAMPAGNA (invariato)
  return ( <>

    {/* 📚 LIBRERIA TEMPLATE */}
    <TemplateLibraryModal
    show={showTemplateLibrary}
    onClose={() => setShowTemplateLibrary(false)}
    templates={templates}
    templateCategory={templateCategory}
    setTemplateCategory={setTemplateCategory}
    templateSearch={templateSearch}
    setTemplateSearch={setTemplateSearch}
    onSelect={(t) => setSelectedTemplate(t)}
  />

{/* 🔎 Anteprima Template */}
<TemplatePreviewModal
    show={!!selectedTemplate}
    template={selectedTemplate}
    onClose={() => setSelectedTemplate(null)}
    onApply={() => {
      setEmailContent(selectedTemplate.html);
      setCampaignMode("template");
      setSelectedTemplate(null);
      setShowTemplateLibrary(false);
      toast.success("Template applicato con successo!");
    }}
  />

    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto shadow-lg relative">
        {/* Header con Badge e pulsante Indietro */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
              title="Torna alla selezione modalità"
            >
              <div className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium hidden sm:inline">Indietro</span>
            </button>

            <div className="h-6 w-px bg-gray-300"></div>

            <h3 className="text-xl font-bold">
              📧 {campaignMode === 'template' ? 'Campagna con Template' : campaignMode === 'builder' ? 'Campagna Builder' : 'Creazione Nuova Campagna'}
            </h3>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            campaignMode === 'template' 
              ? 'bg-purple-100 text-purple-700' 
              : campaignMode === 'builder'
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {campaignMode === 'template' ? '📄 Template Editor' : campaignMode === 'builder' ? '🧩 Builder' : '✏️ Editor Standard'}
          </span>
        </div>

        <div className="space-y-4">
          {/* Nome Campagna */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome Campagna</label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Es. Newsletter Febbraio 2025"
            />
          </div>

          {/* Account di invio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account di invio
            </label>
            {loadingAllAccounts ? (
              <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-blue-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span className="text-gray-500 text-sm">Caricamento account...</span>
              </div>
            ) : allAccounts.length > 0 ? (
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Seleziona un account...</option>
                {allAccounts.map((acc) => (
                  <option key={acc.id} value={acc.email}>
                    {acc.name} ({acc.email})
                    {acc.is_default && ' - Predefinito'}
                    {acc.verified && ' ✓'}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full p-3 border-2 border-yellow-300 bg-yellow-50 rounded-lg">
                <p className="text-yellow-800 text-sm flex items-center gap-2">
                  <span className="font-medium">⚠️ Nessun account email configurato.</span>
                  <button
                    onClick={() => {
                      setShowCampaignModal(false);
                      setActiveTab('settings');
                    }}
                    className="text-blue-600 hover:text-blue-800 underline font-semibold transition-colors"
                  >
                    Configura ora →
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* CC & CCN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">CC</label>
              <input
                type="text"
                value={cc}
                onChange={(e) => handleCcChange(e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 outline-none transition ${
                  ccError ? "border-red-500 focus:ring-red-300" : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="es. mario@azienda.it, luca@promotergroup.eu"
              />
              {ccError && (
                <div className="absolute right-2 top-9 group">
                  <AlertCircle className="w-5 h-5 text-red-600 cursor-pointer" />
                  <div className="absolute bottom-7 right-0 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg whitespace-nowrap z-50">
                    {ccError}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">CCN</label>
              <input
                type="text"
                value={bcc}
                onChange={(e) => handleBccChange(e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 outline-none transition ${
                  bccError ? "border-red-500 focus:ring-red-300" : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="es. admin@azienda.it, support@promotergroup.eu"
              />
              {bccError && (
                <div className="absolute right-2 top-9 group">
                  <AlertCircle className="w-5 h-5 text-red-600 cursor-pointer" />
                  <div className="absolute bottom-7 right-0 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg whitespace-nowrap z-50">
                    {bccError}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Oggetto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Oggetto Email</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Es. Le ultime novità dal nostro team"
            />
          </div>

          {/* Contenuto */}
          <div>
          <div className="flex items-center justify-between mb-2">
    <label className="block text-sm font-medium text-gray-700">Contenuto Email</label>
    <div className="flex items-center gap-2">
      {isBuilderTemplate && (
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
          📐 Template Builder
        </span>
      )}
      {(campaignMode === 'template' || campaignMode === 'builder') && (
        <button
          onClick={() => campaignMode === 'template' ? setShowTemplateLibrary(true) : setCampaignMode('builder')}
          className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
        >
          <FileText className="w-4 h-4" />
          {campaignMode === 'template' ? 'Cambia Template' : 'Modifica Blocchi'}
        </button>
      )}
    </div>
  </div>


  {/* 🔥 BARRA DI FORMATTAZIONE - Solo per modalità standard */}
{/* 🔥 BARRA DI FORMATTAZIONE - Versione Tiptap */}
{!isBuilderTemplate && tiptapEditor && (
  <div className="border-2 border-gray-200 rounded-t-lg bg-gray-50 p-2 flex flex-wrap items-center gap-1 mb-0">
    {/* Gruppo 1: Testo Base */}
    <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
      <button
        onClick={() => tiptapEditor.chain().focus().toggleBold().run()}
        className={`p-2 rounded transition ${
          tiptapEditor.isActive('bold') ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'
        }`}
        title="Grassetto (Ctrl+B)"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
        </svg>
      </button>
      <button
        onClick={() => tiptapEditor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded transition italic font-serif ${
          tiptapEditor.isActive('italic') ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'
        }`}
        title="Corsivo (Ctrl+I)"
      >
        I
      </button>
      <button
        onClick={() => tiptapEditor.chain().focus().toggleUnderline().run()}
        className={`p-2 rounded transition ${
          tiptapEditor.isActive('underline') ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'
        }`}
        title="Sottolineato (Ctrl+U)"
      >
        <span className="underline font-semibold">U</span>
      </button>
      <button
        onClick={() => tiptapEditor.chain().focus().toggleStrike().run()}
        className={`p-2 rounded transition ${
          tiptapEditor.isActive('strike') ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'
        }`}
        title="Barrato"
      >
        <span className="line-through font-semibold">S</span>
      </button>
    </div>

    {/* Gruppo 2: Allineamento */}
    <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
      <button
        onClick={() => tiptapEditor.chain().focus().setTextAlign('left').run()}
        className={`p-2 rounded transition ${
          tiptapEditor.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'
        }`}
        title="Allinea a sinistra"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
        </svg>
      </button>
      <button
        onClick={() => tiptapEditor.chain().focus().setTextAlign('center').run()}
        className={`p-2 rounded transition ${
          tiptapEditor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'
        }`}
        title="Centra"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" />
        </svg>
      </button>
      <button
        onClick={() => tiptapEditor.chain().focus().setTextAlign('right').run()}
        className={`p-2 rounded transition ${
          tiptapEditor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'
        }`}
        title="Allinea a destra"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" />
        </svg>
      </button>
    </div>

    {/* Gruppo 3: Liste */}
    <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
      <button
        onClick={() => tiptapEditor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded transition ${
          tiptapEditor.isActive('bulletList') ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'
        }`}
        title="Elenco puntato"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <button
        onClick={() => tiptapEditor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded transition ${
          tiptapEditor.isActive('orderedList') ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'
        }`}
        title="Elenco numerato"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h13M7 12h13M7 18h13" />
        </svg>
      </button>
    </div>

    {/* Gruppo 4: Colori */}
    <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
      <div className="relative group">
        <button className="p-2 hover:bg-gray-200 rounded transition" title="Colore testo">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        </button>
        <div className="hidden group-hover:block absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50">
          <div className="grid grid-cols-5 gap-1">
            {['#000000', '#ffffff', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#f97316'].map(color => (
              <button
                key={color}
                onClick={() => tiptapEditor.chain().focus().setColor(color).run()}
                className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition"
                style={{ background: color }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="relative group">
        <button className="p-2 hover:bg-gray-200 rounded transition" title="Evidenziazione">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <div className="hidden group-hover:block absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50">
          <div className="grid grid-cols-5 gap-1">
            {['transparent', '#ffff00', '#fde047', '#fbbf24', '#fb923c', '#f87171', '#c084fc', '#60a5fa', '#4ade80', '#e5e7eb'].map(color => (
              <button
                key={color}
                onClick={() => tiptapEditor.chain().focus().setHighlight({ color }).run()}
                className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition"
                style={{ background: color }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Gruppo 5: Link */}
    <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
      <button
        onClick={() => {
          const url = prompt('Inserisci URL:');
          if (url) {
            tiptapEditor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className={`p-2 rounded transition ${
          tiptapEditor.isActive('link') ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-blue-600'
        }`}
        title="Inserisci link"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </button>
    </div>

    {/* Gruppo 6: Annulla/Ripeti */}
    <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
      <button
        onClick={() => tiptapEditor.chain().focus().undo().run()}
        disabled={!tiptapEditor.can().undo()}
        className={`p-2 rounded transition ${
          !tiptapEditor.can().undo() ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200'
        }`}
        title="Annulla"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </button>
      <button
        onClick={() => tiptapEditor.chain().focus().redo().run()}
        disabled={!tiptapEditor.can().redo()}
        className={`p-2 rounded transition ${
          !tiptapEditor.can().redo() ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200'
        }`}
        title="Ripeti"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
        </svg>
      </button>
    </div>

    {/* Pulisci Formattazione */}
    <button
      onClick={() => tiptapEditor.chain().focus().clearNodes().unsetAllMarks().run()}
      className="ml-auto p-2 hover:bg-red-50 text-red-600 rounded transition"
      title="Rimuovi formattazione"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
)}


   {/* 🔥 SE È UN TEMPLATE BUILDER, MOSTRA HTML RAW */}
   {isBuilderTemplate ? (
  <div className="space-y-3">
    {/* Controlli larghezza */}
    <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
      <span className="text-sm font-medium text-gray-700">📐 Anteprima:</span>
      <div className="flex gap-2">
        <button
          onClick={() => setTemplatePreviewWidth('mobile')}
          className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
            templatePreviewWidth === 'mobile' 
              ? 'bg-green-600 text-white shadow-sm' 
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          📱 Mobile (375px)
        </button>
        <button
          onClick={() => setTemplatePreviewWidth('desktop')}
          className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
            templatePreviewWidth === 'desktop' 
              ? 'bg-green-600 text-white shadow-sm' 
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          💻 Desktop (600px)
        </button>
        <button
          onClick={() => setTemplatePreviewWidth('full')}
          className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
            templatePreviewWidth === 'full' 
              ? 'bg-green-600 text-white shadow-sm' 
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          ↔️ Full Width
        </button>
      </div>
    </div>
    
  {/* Preview */}
<div className="border-2 border-green-300 rounded-lg p-6 bg-gray-100 min-h-[300px] overflow-auto">
  {/* Wrapper che simula un client email */}
  <div className="mx-auto" style={{ maxWidth: '100%' }}>
    <div 
      dangerouslySetInnerHTML={{ __html: emailContent }}
      style={{
        margin: '0 auto',
        width: '100%',
        maxWidth: '100%'
      }}
    />
  </div>
</div>
      {/* Pulsanti azione */}
      <div className="flex gap-2">
      <button
  onClick={() => {
    sessionStorage.setItem('editingBuilderTemplate', emailContent);
    
    // 🔥 Se abbiamo i blocchi, salvali per il builder
    const savedBlocks = sessionStorage.getItem('builderBlocks');
    if (savedBlocks) {
      sessionStorage.setItem('editingBuilderBlocks', savedBlocks);
      console.log('💾 Blocchi salvati per modifica');
    } else {
      // Se non ci sono blocchi, crea un blocco dal contenuto corrente
      const contentBlock = {
        id: 'custom-template',
        name: 'Template Personalizzato',
        icon: '📄',
        category: 'layout',
        html: emailContent,
        instanceId: `custom-${Date.now()}`
      };
      sessionStorage.setItem('editingBuilderBlocks', JSON.stringify([contentBlock]));
      console.log('💾 Creato blocco dal contenuto corrente');
    }
    
    setCampaignMode('builder');
    toast('📝 Ritorno al builder...', { 
      duration: 1500,
      icon: '🔄',
      style: {
        background: '#3b82f6',
        color: '#fff',
      }
    });
  }}
  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
>
  <Edit3 className="w-4 h-4" />
  Modifica nel Builder
</button>
        
        <button
          onClick={() => {
                // 🔥 Pulisci tutto quando esci senza scegliere
    sessionStorage.removeItem('builderTemplate');
    sessionStorage.removeItem('builderBlocks');
    sessionStorage.removeItem('currentEmailContent');
    sessionStorage.removeItem('isBuilderTemplate');
            setEmailContent('<p></p>');
            setIsBuilderTemplate(false);
            sessionStorage.removeItem('isBuilderTemplate'); // 🔥 AGGIUNGI QUESTA RIGA
            setEditorKey(prev => prev + 1);
          }}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg transition"
        >
          🗑️ Rimuovi Template
        </button>
      </div>
      
      {/* Editor HTML raw opzionale */}
      <details className="border border-gray-200 rounded-lg">
        <summary className="cursor-pointer p-3 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700">
          📝 Modifica HTML (Avanzato)
        </summary>
        <textarea
          value={emailContent}
          onChange={(e) => setEmailContent(e.target.value)}
          className="w-full h-64 p-3 border-t border-gray-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </details>
    </div>
  ) : (
    /* 🔥 ALTRIMENTI USA TIPTAP EDITOR NORMALE */
    <TiptapEditor 
    key={editorKey}
    content={emailContent} 
    onChange={setEmailContent}
    onEditorReady={(editor) => setTiptapEditor(editor)} // ← Cattura l'editor
  />
  )}
</div>

          {/* Allegati */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
              Allegati
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
              >
                <Paperclip className="w-4 h-4" /> Aggiungi allegato
              </button>
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAddAttachments}
              multiple
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.zip"
            />
            {attachments.length > 0 ? (
              <>
                <ul className="mt-2 space-y-2">
                  {attachments.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {item.preview ? (
                          <img src={item.preview} alt="preview" className="w-8 h-8 object-cover rounded" />
                        ) : (
                          <Paperclip className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="truncate">{item.file.name}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveAttachment(index)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-gray-500 text-right">
                  Totale allegati: <strong>{totalSize}</strong>
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500 italic">Nessun allegato aggiunto</p>
            )}
          </div>

          {/* Destinatari */}
          <div className="mt-4">
            <RecipientSelect
              value={recipientList}
              onChange={setRecipientList}
              contacts={contacts}
            />
          </div>
        </div>

        {/* Pulsanti */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleCancel}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition"
          >
            Annulla
          </button>
          <button
            onClick={handleSaveDraft}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg transition"
          >
            💾 Salva come Bozza
          </button>
          <button
            onClick={handleSend}
            disabled={!!ccError || !!bccError}
            className={`flex-1 py-2 px-4 rounded-lg text-white transition ${
              ccError || bccError
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Invia Ora
          </button>
        </div>
      </div>

      {/* Modali di conferma (invariati) */}
      {/* Modali di conferma */}
{showConfirmSend && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        Sei sicuro di voler inviare questa campagna?
      </h3>
      <p className="text-sm text-gray-600 mb-5">
        L'email verrà inviata ai destinatari selezionati.
      </p>
      <div className="flex justify-center gap-3">
        <button
          onClick={() => setShowConfirmSend(false)}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
        >
          Annulla
        </button>
        <button
          onClick={confirmSend} // ✅ CORRETTO: era confirmSend
          disabled={sending} // ✅ Usa 'sending' se esiste già
          className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? "Invio in corso..." : "Invia"} {/* ✅ Mostra stato */}
        </button>
      </div>
    </div>
  </div>
)}

      <AnimatePresence>
        {showConfirmExit && (
          <motion.div
            key="confirmExit"
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full text-center border border-gray-100"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: "spring", stiffness: 220, damping: 25 }}
            >
              <h3 className="text-lg font-semibold mb-3 text-gray-800">
                Sicuro di voler uscire dalla campagna?
              </h3>
              <p className="text-sm text-gray-600 mb-5">
                Hai modifiche non salvate che andranno perse.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowConfirmExit(false)}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
                >
                  Rimani
                </button>
                <button
                  onClick={confirmExit}
                  className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  Esci comunque
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showDraftError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center border-t-4 border-yellow-500">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Campi obbligatori mancanti
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              Per salvare la bozza devi inserire <b>Nome Campagna</b> e <b>Oggetto Email</b>.
            </p>
            <button
              onClick={() => setShowDraftError(false)}
              className="px-4 py-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition"
            >
              Ok, capito
            </button>
          </div>
        </div>
      )}

      {isSending && (
        <div className="fixed bottom-6 right-6 bg-white border border-gray-200 shadow-xl rounded-lg w-80 overflow-hidden animate-fadeIn z-[9999]">
          <div className="flex items-center gap-3 px-4 py-3">
            <Mail className="w-5 h-5 text-blue-600 animate-pulse" />
            <div className="flex-1">
              <p className="text-gray-800 text-sm font-medium">Invio campagna...</p>
              <p className="text-gray-500 text-xs">
                ✉️ {sentCount}/{totalRecipients} inviate — ❌ {failedCount} fallite
              </p>
            </div>
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          </div>
          <div className="h-2 bg-gray-200">
            <div
              className="h-2 bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {showDraftSuccess && (
        <div className="fixed bottom-6 right-6 bg-yellow-500 text-white px-4 py-3 rounded-lg shadow-lg animate-fadeIn animate-fadeOut z-[9999]">
          💾 Bozza salvata correttamente
        </div>
      )}
    </div>
    </>
  );

};
// --------------------- MODALE NUOVO CONTATTO ---------------------
const ContactModal = ({ show, onClose, onAdd, user }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagOptions, setTagOptions] = useState([]);



  const { tags, loading: tagsLoading } = useTags();
  // const tagOptions = tags.map(t => ({
  //   value: t.value,
  //   label: t.label,
  //   color: t.color
  // }));


  // 🔄 Nasconde automaticamente il messaggio di errore dopo 3 secondi
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

   // 🔄 Carica i tag da Supabase

const fetchTags = async () => {
  if (!user?.id) return;
  setLoadingTags(true);
  try {
    const res = await fetch(`/api/tags/get?user_id=${user.id}`);
    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.message || "Errore caricamento tag");
    }

    const formatted = result.data.map((t) => ({
      value: t.value,
      label: t.label,
      color: t.color,
    }));

    console.log('🏷️ Tag caricati:', formatted); // DEBUG
    setTagOptions(formatted);
  } catch (err) {
    console.error("💥 Errore fetch tag:", err);
    toast.error("Errore durante il caricamento dei tag");
  } finally {
    setLoadingTags(false);
  }
};

// Carica i tag quando cambia user.id
useEffect(() => {
  fetchTags();
}, [user?.id]);


  // ✅ Aggiunta contatto
  const handleAdd = async () => {
    if (!name.trim() || !email.trim() || selectedTags.length === 0) {
      setError("Tutti i campi sono obbligatori.");
      toast.error("⚠️ Nome, email e tag sono obbligatori!");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
  
    const newContact = {
      name: name.trim(),
      email: email.trim(),
      status: "active",
      tags: selectedTags.map((t) => t.value),
    };
  
    try {
      const res = await fetch("/api/contacts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          contacts: [newContact],
        }),
      });
  
      const text = await res.text();
      let result = JSON.parse(text);
  
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Errore durante il salvataggio del contatto.");
      }
  
      toast.success("✅ Contatto salvato con successo!");
      resetForm();
      
      // ✅ AGGIUNGI QUESTA RIGA - Ricarica i contatti dal DB
      await fetchContacts();
      
      onClose();
  
    } catch (err) {
      console.error("💥 Errore salvataggio contatto:", err);
      toast.error(`❌ ${err.message}`);
    }
  };
  // ✅ Reset form
  const resetForm = () => {
    setName("");
    setEmail("");
    setSelectedTags([]);
    setError("");
  };

  // ❌ Gestione Annulla
const handleCancel = () => {
  if (name || email || selectedTags.length > 0) {
    setShowConfirm(true);
  } else {
    resetForm();
    onClose();
  }
};

// ✅ Conferma Annulla
const confirmCancel = () => {
  resetForm();
  setShowConfirm(false);
  onClose();
};

const cancelConfirm = () => {
  setShowConfirm(false);
};



  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      {/* Modale principale */}
      <div
        className={`relative bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl transition-all duration-300 animate-fadeIn ${
          shake
            ? "animate-shake border-2 border-red-500 glow-red"
            : error
            ? "border-2 border-red-400 glow-red"
            : "border-2 border-blue-200 glow-blue"
        }`}
      >
        <h3 className="text-xl font-bold mb-6">Nuovo Contatto</h3>

        {/* ⚠️ Messaggio errore inline */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg animate-fadeIn">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              placeholder="Es. Mario Rossi"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              placeholder="mario.rossi@email.com"
            />
          </div>

          {/* Tag */}
          <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">Tag</label>

  <div className="flex gap-2 items-start">
    <div className="flex-1">
      {loadingTags ? (
        <div className="text-gray-500 text-sm">Caricamento tag...</div>
      ) : (
        <Select
          isMulti
          options={tagOptions}
          value={selectedTags}
          onChange={setSelectedTags}
          placeholder="Seleziona tag..."
          className="text-sm"
        />
      )}
    </div>

    {/* ➕ Bottone crea nuovo tag */}
    <button
      onClick={() => setShowTagModal(true)}
      className="flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition"
      title="Crea nuovo tag"
    >
      <Plus className="w-4 h-4" />
    </button>
  </div>

{/* Modale aggiunta tag */}
{showTagModal && (
  <AddTagModal
    show={showTagModal}
    onClose={() => {
      setShowTagModal(false);
      fetchTags(); // 🔥 Ricarica i tag quando chiudi il modale
    }}
    // 🔥 RIMUOVI completamente onAdd - non serve più perché createTag() lo gestisce già
  />
)}

</div>
        </div>

        {/* Pulsanti */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleCancel}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Aggiungi Contatto
          </button>
        </div>
      </div>

      {/* 🔹 Popup conferma annullamento */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[60] animate-fadeIn">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 border border-gray-200 animate-zoomIn">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              Annullare l’inserimento?
            </h4>
            <p className="text-sm text-gray-600 mb-6">
              Hai inserito dei dati. Sei sicuro di voler annullare l’aggiunta del contatto?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={cancelConfirm}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
              >
                Continua Modifica
              </button>
              <button
                onClick={confirmCancel}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Sì, Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


  // Modal per profilo utente
  const ProfileModal = () => {
    
    
    const [user, setUser] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState('Massimo');
    const [surname, setSurname] = useState('Mole');
    const [email, setEmail] = useState('giovannimole@yopmail.com');
    const [photo, setPhoto] = useState(null);
    const [resultMessage, setResultMessage] = useState(null);
    const [showMoveToApprovalModal, setShowMoveToApprovalModal] = useState(false);
const [userToMoveToApproval, setUserToMoveToApproval] = useState(null);
    const [shake, setShake] = useState(false);
const [profileLoaded, setProfileLoaded] = useState(false);
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
const [registerSaving, setRegisterSaving] = useState(false);
const [registerData, setRegisterData] = useState({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''  // <-- AGGIUNGI QUESTO
});
    // ... stati esistenti
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    name: '',
    email: '',
    bio: '',
    avatar: null,
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);


    const {
      profile,
      loading,
      saveLanguage,
      saveDateTimeFormat,
      saveNotifications,
      saveNotificationsPrimary,
      savePrivacy,
      changePassword,
      saveSystemSettings

    } = useProfile();

    // 🆕 Stati per ogni sezione
    const [notificationsData, setNotificationsData] = useState({});
    const [notificationsDataPrimary, setNotificationsDataPrimary] = useState({});
    const [languageData, setLanguageData] = useState('it');
    const [formatData, setFormatData] = useState({ date_format: 'DD/MM/YYYY', time_format: '24h' });
    const [privacyData, setPrivacyData] = useState(false);
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [systemSettings, setSystemSettings] = useState({});
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
const [saving, setSaving] = useState(false);

const handleClose = () => {
  if (saving) {
    setShake(true);
    navigator.vibrate?.(100); // vibrazione haptica su mobile (se supportata)
    setTimeout(() => setShake(false), 500);
    return;
  }
  setShowCloseConfirm(true);
};

const confirmClose = () => {
  setShowCloseConfirm(false);
  setShowProfileModal(false); // chiude il modale principale
};
const handleMoveToApproval = (userId, userName, userEmail) => {
  setUserToMoveToApproval({ id: userId, name: userName, email: userEmail });
  setShowMoveToApprovalModal(true);
};

const confirmMoveToApproval = async () => {
  if (!userToMoveToApproval) return;
  
  try {
    console.log('🔄 Rimettendo in approvazione:', userToMoveToApproval.id);
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', userToMoveToApproval.id)
      .select();

    if (error) throw error;

    toast.success(`✅ ${userToMoveToApproval.name} rimesso in attesa di approvazione`);
    
    // Ricarica entrambe le liste
    await fetchRejectedUsers();
    await fetchPendingUsers();
    
    // Chiudi il modal
    setShowMoveToApprovalModal(false);
    setUserToMoveToApproval(null);
    
  } catch (error) {
    console.error('❌ Errore:', error);
    toast.error(`❌ Errore: ${error.message}`);
  }
};

const cancelClose = () => {
  setShowCloseConfirm(false); // chiude solo il popup di conferma
};
    
    const [profileData, setProfileData] = useState({
      name: profile?.name || '',
      email: profile?.email || '',
      role: profile?.role || 'user',
      language: profile?.language || 'it',
      timezone: profile?.timezone || 'Europe/Rome',
    });

    const handleUploadAvatar = async (file) => {
      try {
        setUploadingAvatar(true);
    
        // Crea nome file unico
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;
    
        // Upload su Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('user-avatars')
          .upload(filePath, file);
    
        if (uploadError) throw uploadError;
    
        // Ottieni URL pubblico
        const { data } = supabase.storage
          .from('user-avatars')
          .getPublicUrl(filePath);
    
        return data.publicUrl;
      } catch (error) {
        console.error('❌ Errore upload avatar:', error);
        toast.error('Errore nel caricamento dell\'immagine');
        return null;
      } finally {
        setUploadingAvatar(false);
      }
    };

     
    const handleRegisterUser = async (e) => {
      e.preventDefault();
      setRegisterSaving(true);
      setRegisterMessage(null);
    
      // Validazione password
      if (registerData.password !== registerData.confirmPassword) {
        setRegisterMessage({
          type: 'error',
          text: '❌ Le password non coincidono!'
        });
        setRegisterSaving(false);
        return;
      }
    
      try {
        // 1. Controlla se l'email esiste già
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('email', registerData.email)
          .single();
    
        if (existingProfile) {
          setRegisterMessage({
            type: 'error',
            text: '❌ Questa email è già registrata!'
          });
          setRegisterSaving(false);
          return;
        }
    
        // 2. Crea l'utente in Supabase Auth (senza emailRedirectTo per evitare conferma)
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: registerData.email,
          password: registerData.password,
          options: {
            emailRedirectTo: undefined, // Disabilita email di conferma
            data: {
              full_name: registerData.name
            }
          }
        });
    
        if (authError) {
          console.error('Auth error:', authError);
          throw new Error(authError.message);
        }
    
        if (!authData.user) {
          throw new Error('Utente non creato');
        }
    
        // 3. Aspetta un attimo per il trigger
        await new Promise(resolve => setTimeout(resolve, 1000));
    
        // 4. Verifica e aggiorna il profilo
        const { data: profile, error: checkError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();
    
        if (checkError || !profile) {
          // Il profilo non esiste, crealo manualmente
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: registerData.email,
              full_name: registerData.name,
              status: 'pending',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
    
          if (insertError) {
            console.error('Insert error:', insertError);
            throw insertError;
          }
        } else {
          // Il profilo esiste, aggiornalo
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              full_name: registerData.name,
              status: 'pending',
              updated_at: new Date().toISOString()
            })
            .eq('id', authData.user.id);
    
          if (updateError) {
            console.error('Update error:', updateError);
            throw updateError;
          }
        }
    
        setRegisterMessage({
          type: 'success',
          text: `✅ Utente ${registerData.name} registrato! Apparirà nella lista in attesa di approvazione.`
        });
    
        // Reset form
        setRegisterData({ name: '', email: '', password: '', confirmPassword: '' });
    
        // Ricarica la lista utenti pending
        if (typeof fetchPendingUsers === 'function') {
          fetchPendingUsers();
        }
    
      } catch (error) {
        console.error('❌ Errore registrazione completo:', error);
        setRegisterMessage({
          type: 'error',
          text: `❌ Errore: ${error.message || 'Errore durante la registrazione'}`
        });
      } finally {
        setRegisterSaving(false);
      }
    };
    const handleSaveProfile = async () => {
      try {
        setSaving(true);
    
        let avatarUrl = profile.avatar_url;
    
        // Upload avatar se presente
        if (editProfileData.avatar) {
          const newAvatarUrl = await handleUploadAvatar(editProfileData.avatar);
          if (newAvatarUrl) avatarUrl = newAvatarUrl;
        }
    
        // Salva nel database
        const { data, error } = await supabase
          .from('user_settings')
          .update({
            name: editProfileData.name,
            email: editProfileData.email,
            bio: editProfileData.bio,
            avatar_url: avatarUrl,
          })
          .eq('user_id', user.id)
          .select()
          .single();
    
        if (error) throw error;
    
        setProfile(data);
        setShowEditProfile(false);
        toast.success('✅ Profilo aggiornato con successo!', {
          icon: '🎉',
          style: { background: '#16a34a', color: '#ffffff' },
        });
      } catch (error) {
        console.error('❌ Errore salvataggio profilo:', error);
        toast.error('❌ Errore nel salvataggio del profilo');
      } finally {
        setSaving(false);
      }
    };

    useEffect(() => {
      if (showEditProfile && profile) {
        setEditProfileData({
          name: profile.name || '',
          email: profile.email || '',
          bio: profile.bio || '',
          avatar: null,
        });
      }
    }, [showEditProfile, profile]);

    // 🆕 Carica i dati del profilo quando disponibile
    useEffect(() => {
      if (profile) {
        setNotificationsData({
          notify_new_campaigns: profile.notify_new_campaigns ?? true,
          notify_campaign_results: profile.notify_campaign_results ?? true,
          notify_urgent_updates: profile.notify_urgent_updates ?? true,
          notify_push_new_tasks: profile.notify_push_new_tasks ?? true,
          notify_push_mentions: profile.notify_push_mentions ?? true,
          notify_push_reminders: profile.notify_push_reminders ?? true,
          reminder_weekly_review: profile.reminder_weekly_review ?? true,
          reminder_clock_in: profile.reminder_clock_in ?? true,
        });

        setNotificationsDataPrimary({
          notify_new_campaigns: profile.notify_new_campaigns ?? true,
          notify_campaign_results: profile.notify_campaign_results ?? true,
          notify_report_weekly: profile.notify_report_weekly ?? true,
          notify_new_contacts: profile.notify_new_contacts ?? true,
        });
    
        setProfileData({
          name: profile.name || '',
          email: profile.email || '',
          language: profile.language || 'it',
          timezone: profile.timezone || 'Europe/Rome',
          role: profile.role || '',
        });

        setLanguageData(profile.language || 'it');

        setFormatData({
          date_format: profile.date_format || 'DD/MM/YYYY',
          time_format: profile.time_format || '24h',
        });

        setPrivacyData(profile.accept_offers ?? false);

        setSystemSettings({
          smtp_server: profile.smtp_server || 'smtp.mailmassprom.com',
          smtp_port: profile.smtp_port || 587,
          sender_email: profile.sender_email || 'noreply@mailmassprom.com',
          two_factor_enabled: profile.two_factor_enabled ?? false,
          auto_login: profile.auto_login ?? true,
        });

        setHasChanges(false);
      }
    }, [profile]);

    // ✅ AGGIUNGI QUESTA FUNZIONE HELPER:
    const handleChange = () => {
      setHasChanges(true);
    };

   
    // 🆕 Mostra messaggio di successo
    const showSuccessMessage = (message) => {
      const msg = document.createElement("div");
      msg.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 6L9 17l-5-5"></path>
        </svg>
        <span>${message}</span>
      </div>
    `;
      msg.style.position = "fixed";
      msg.style.top = "20px";
      msg.style.left = "50%";
      msg.style.transform = "translateX(-50%)";
      msg.style.background = "#d1fae5";
      msg.style.color = "#065f46";
      msg.style.padding = "12px 24px";
      msg.style.borderRadius = "8px";
      msg.style.fontSize = "14px";
      msg.style.fontWeight = "500";
      msg.style.zIndex = "9999";
      msg.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
      document.body.appendChild(msg);

      setTimeout(() => msg.remove(), 2700);
    };

    // 🆕 Mostra messaggio di errore
    const showErrorMessage = (message) => {
      const msg = document.createElement("div");
      msg.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>${message}</span>
      </div>
    `;
      msg.style.position = "fixed";
      msg.style.top = "20px";
      msg.style.left = "50%";
      msg.style.transform = "translateX(-50%)";
      msg.style.background = "#fee2e2";
      msg.style.color = "#b91c1c";
      msg.style.padding = "12px 24px";
      msg.style.borderRadius = "8px";
      msg.style.fontSize = "14px";
      msg.style.fontWeight = "500";
      msg.style.zIndex = "9999";
      msg.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
      document.body.appendChild(msg);

      setTimeout(() => msg.remove(), 3000);
    };

    
    // ✅ Salvataggio unico: notifiche + informazioni account + preferenze
    const handleSaveNotificationsPrimary = async () => {
      setSaving(true);
    
      const mergedData = {
        ...notificationsDataPrimary,
        ...profileData,
      };
    
      const result = await saveNotificationsPrimary(mergedData);
    
      setSaving(false);
    
      if (result.success) {
        toast.success(result.message, {
          icon: '🎉',
          style: { background: '#16a34a', color: '#ffffff' },
        });
        // setTimeout(() => setShowProfileModal(false), 1800);
      } else {
        toast.error(result.error, {
          icon: '⚠️',
          style: { background: '#dc2626', color: '#ffffff' },
        });
      }
    };

    // 🆕 Salva Notifiche
    const handleSaveNotifications = async () => {
      const result = await saveNotifications(notificationsData);

      if (result.success) {
        toast.success(result.message, {
          icon: '🎉',
          style: { background: '#16a34a', color: '#ffffff' },
        });
        // setTimeout(() => setShowProfileModal(false), 1800);
      } else {
        toast.error(result.error, {
          icon: '⚠️',
          style: { background: '#dc2626', color: '#ffffff' },
        });
      }
    };
    // 🆕 Salva Lingua
    const handleSaveLanguage = async () => {
      const result = await saveLanguage(languageData);
      if (result.success) {
        toast.success(result.message, {
          icon: '🎉',
          style: { background: '#16a34a', color: '#ffffff' },
        });
        // setTimeout(() => setShowProfileModal(false), 1800);
      } else {
        toast.error(result.error, {
          icon: '⚠️',
          style: { background: '#dc2626', color: '#ffffff' },
        });
      }
    };

    // 🆕 Salva Formato
    const handleSaveFormat = async () => {
      const result = await saveDateTimeFormat(formatData);
      if (result.success) {
        toast.success(result.message, {
          icon: '🎉',
          style: { background: '#16a34a', color: '#ffffff' },
        });
        // setTimeout(() => setShowProfileModal(false), 1800);
      } else {
        toast.error(result.error, {
          icon: '⚠️',
          style: { background: '#dc2626', color: '#ffffff' },
        });
      }
    };
    // 🆕 Salva Privacy
    const handleSavePrivacy = async () => {
      const result = await savePrivacy(privacyData);
      if (result.success) {
        toast.success(result.message, {
          icon: '🎉',
          style: { background: '#16a34a', color: '#ffffff' },
        });
        // setTimeout(() => setShowProfileModal(false), 1800);
      } else {
        toast.error(result.error, {
          icon: '⚠️',
          style: { background: '#dc2626', color: '#ffffff' },
        });
      }
    };
    

    // 🆕 Cambia Password
    const handleChangePassword = async () => {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        showErrorMessage('❌ Le password non corrispondono');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        showErrorMessage('❌ La password deve contenere almeno 6 caratteri');
        return;
      }

      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      if (result.success) {
        toast.success(result.message, {
          icon: '🎉',
          style: { background: '#16a34a', color: '#ffffff' },
        });
        // setTimeout(() => setShowProfileModal(false), 1800);
      } else {
        toast.error(result.error, {
          icon: '⚠️',
          style: { background: '#dc2626', color: '#ffffff' },
        });
      }
    };

    // 🆕 Salva Impostazioni Sistema
    const handleSaveSystemSettings = async () => {
      const result = await saveSystemSettings(systemSettings);
      if (result.success) {
        toast.success(result.message, {
          icon: '🎉',
          style: { background: '#16a34a', color: '#ffffff' },
        });
        // setTimeout(() => setShowProfileModal(false), 1800);
      } else {
        toast.error(result.error, {
          icon: '⚠️',
          style: { background: '#dc2626', color: '#ffffff' },
        });
      }
    };


    const handleSave = () => {
      // Logica per salvare le modifiche
      setIsEditing(false);
    };


    const handleChangePhoto = () => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.click();


      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setPhoto(reader.result);
          reader.readAsDataURL(file);
        }
      };
    };
    if (!showProfileModal) return null;
// useEffect per caricare i dati del profilo
useEffect(() => {
  const fetchUserProfile = async () => {
    if (!showProfileModal) return;
    if (profileLoaded) return; // <-- AGGIUNGI QUESTO: Non ricaricare se già caricato
    
    setLoadingProfile(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select(`
            *,
            role:roles (
              name
            )
          `)
          .eq('id', authUser.id)
          .single();
        
        setUser(profile);
        setProfileLoaded(true); // <-- AGGIUNGI QUESTO
      }
    } catch (error) {
      console.error('Errore caricamento profilo:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  fetchUserProfile();
}, [showProfileModal, profileLoaded]); // <-- AGGIUNGI profileLoaded alle dipendenze

// Quando chiudi il modale, resetta la flag
const handleCloseModal = () => {
  setShowProfileModal(false);
  setProfileLoaded(false); // <-- AGGIUNGI QUESTO per ricaricare alla prossima apertura
};

// Nel JSX del modale, aggiungi il loading state
if (!showProfileModal) return null;
// Calcola il numero di utenti pending
const pendingCount = pendingUsers.filter(u => u.status === 'pending').length;
const rejectedCount = rejectedUsers.length; // <-- AGGIUNGI QUESTA
// if (loadingProfile && !user) {  // <-- AGGIUNGI "&& !user"
//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg p-8">
//         <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
//         <p className="mt-4 text-gray-600">Caricamento profilo...</p>
//       </div>
//     </div>
//   );
// }
    return (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg w-full max-w-6xl mx-4 h-[90vh] flex overflow-hidden">
                {/* Sidebar del profilo */}
                <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col"> {/* 🔥 flex flex-col */}
                <div className="p-6 flex-shrink-0"> {/* 🔥 flex-shrink-0 */}
                <div className="text-center">
                    {/* Avatar grande */}
                    <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-medium mx-auto mb-4">
                    {getUserInitials(user?.full_name || user?.name || 'U')}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {user?.full_name || user?.name || 'Utente'}
                    </h2>
              <button
                onClick={() => setShowEditProfile(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 mx-auto"
              >
                <Edit3 className="w-3 h-3" />
                Modifica profilo
              </button>
                  </div>
                  </div>
                  {/* Tabs del profilo */}
                  <nav className="flex-1 overflow-y-auto px-6 pb-6 space-y-1"> {/* 🔥 flex-1 overflow-y-auto */}
                    {/* Solo per admin e super_admin */}
{(user?.role?.name === 'admin' || user?.role?.name === 'super_admin') && (
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                      Generale
                    </div>
                      )}
{/* Nella sidebar del profilo, aggiungi questi bottoni dopo gli altri */}

{/* Solo per admin e super_admin */}
{(user?.role?.name === 'admin' || user?.role?.name === 'super_admin') && (
  <>
<button
  onClick={() => setActiveProfileTab('gestione-utenti')}
  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
    activeProfileTab === 'gestione-utenti'
      ? 'bg-blue-600 text-white'
      : 'text-gray-700 hover:bg-gray-100'
  }`}
>
<Clock className="w-5 h-5" />
  <div className="flex-1 text-left">
    <div className="font-medium">Utenti in Attesa</div>
    <div className="text-xs opacity-75">Approvazioni pendenti</div>
  </div>
  {/* 🔥 Badge rosso - conta solo quelli con status 'pending' */}
  {pendingUsers.filter(u => u.status === 'pending').length > 0 && (
    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
      {pendingUsers.filter(u => u.status === 'pending').length}
    </span>
  )}
</button>

{/* 🆕 NUOVO TAB - UTENTI RIFIUTATI */}
<button
      onClick={() => {
        setActiveProfileTab('utenti-rifiutati');
        // fetchRejectedUsers();
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        activeProfileTab === 'utenti-rifiutati'
          ? 'bg-blue-600 text-white'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <XCircle className="w-5 h-5" />
      <div className="flex-1 text-left">
        <div className="font-medium">Utenti Rifiutati</div>
        <div className="text-xs opacity-75">Visualizza rifiutati</div>
      </div>
        {/* 🔥 Badge rosso per utenti rifiutati */}
  {rejectedCount > 0 && (
    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
      {rejectedCount}
    </span>
  )}
    </button>

    <button
      onClick={() => setActiveProfileTab('gestione-permessi')}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        activeProfileTab === 'gestione-permessi'
          ? 'bg-blue-600 text-white'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <Shield className="w-5 h-5" />
      <div className="flex-1 text-left">
        <div className="font-medium">Gestione Permessi</div>
        <div className="text-xs opacity-75">Ruoli e accessi</div>
      </div>
    </button>

    <button
      onClick={() => setActiveProfileTab('registra-utente')}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        activeProfileTab === 'registra-utente'
          ? 'bg-blue-600 text-white'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >      
      <UserPlus className="w-5 h-5" />
      <div className="flex-1 text-left">
        <div className="font-medium">Registra Utente</div>
        <div className="text-xs opacity-75">Crea nuovo account</div>
      </div>
    </button>
  </>
)}

                {/* Solo per admin e super_admin */}
{(user?.role?.name === 'admin' || user?.role?.name === 'super_admin') && (
  <>
    <button
      onClick={() => setActiveProfileTab('notifiche')}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
        activeProfileTab === 'notifiche'
          ? 'text-blue-600 bg-blue-50 border border-blue-200'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      Notifiche
    </button>

    <button
      onClick={() => setActiveProfileTab('impostazioni')}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
        activeProfileTab === 'impostazioni'
          ? 'text-blue-600 bg-blue-50 border border-blue-200'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      Impostazioni
    </button>
  </>
)}
                    <div className="pt-6">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                        Account
                      </div>

                      <button
                        onClick={() => setActiveProfileTab('lingua')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeProfileTab === 'lingua'
                          ? 'text-blue-600 bg-blue-50 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        Lingua
                      </button>

                      <button
                        onClick={() => setActiveProfileTab('formato')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeProfileTab === 'formato'
                          ? 'text-blue-600 bg-blue-50 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        Formato data/ora
                      </button>

                      <button
                        onClick={() => setActiveProfileTab('notifiche2')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeProfileTab === 'notifiche2'
                          ? 'text-blue-600 bg-blue-50 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        Notifiche
                      </button>

                      <button
                        onClick={() => setActiveProfileTab('privacy')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeProfileTab === 'privacy'
                          ? 'text-blue-600 bg-blue-50 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        Privacy
                      </button>

                      <div className="pt-6">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                          Accesso e sicurezza
                        </div>

                        <button
                          onClick={() => setActiveProfileTab('cambia-password')}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeProfileTab === 'cambia-password'
                            ? 'text-blue-600 bg-blue-50 border border-blue-200'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                          Cambia la tua password
                        </button>
                      </div>
                      {/* Contenuto basato sulla selezione del tab */}
                      {activeProfileTab === 'notifiche2' && <div>Sezione Notifiche</div>}
                      {activeProfileTab === 'lingua' && <div>Sezione Lingua</div>}
                      {activeProfileTab === 'formato' && <div>Sezione Formato data/ora</div>}
                      {activeProfileTab === 'privacy' && <div>Sezione Privacy</div>}
                      {activeProfileTab === 'cambia-password' && <div>Sezione Cambia password</div>}
                    </div>
                  </nav>
                </div>

                {/* Contenuto principale del profilo */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Il mio profilo</h1>
                      <p className="text-gray-600">Gestisci le tue informazioni personali e le preferenze dell'account</p>
                    </div>
                    <button
                      onClick={handleCloseModal}
                      className="text-gray-400 hover:text-gray-600 p-2"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Contenuto dinamico basato sul tab attivo */}
                  {/* 🆕 TAB LINGUA */}
                  {activeProfileTab === 'lingua' && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4">Seleziona lingua</h2>
                      <select
                        id="language"
                        name="language"
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        value={languageData}
                        onChange={(e) => setLanguageData(e.target.value)}
                      >
                        <option value="it">Italiano</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                      </select>

                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={handleClose}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                          disabled={saving}
                        >
                          Annulla
                        </button>
                        <button
                          onClick={handleSaveLanguage}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                          disabled={saving}
                        >
                          {saving ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Salvataggio...
                            </span>
                          ) : 'Salva Modifiche'}
                        </button>
                      </div>
                    </div>
                  )}


                  {/* Contenuto dinamico basato sul tab attivo */}
                  {/* 🆕 TAB FORMATO DATA/ORA */}
                  {activeProfileTab === 'formato' && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4">Formato Data/Ora</h2>

                      <div>
                        <label htmlFor="date_format_dmy" className="text-sm font-medium text-gray-700">Data</label>

                        <div className="flex gap-4 mt-2">
                          <label className="flex items-center gap-2">
                            <input
                              id="date_format_dmy"
                              name="date_format"
                              type="radio"
                              value="DD/MM/YYYY"
                              checked={formatData.date_format === 'DD/MM/YYYY'}
                              onChange={(e) => setFormatData({ ...formatData, date_format: e.target.value })}
                            />
                            <span className="ml-2">GG/MM/AAAA</span>
                          </label>
                          <label htmlFor="date_format_mdy" className="flex items-center gap-2">
                            <input
                              id="date_format_mdy"
                              name="date_format"
                              type="radio"
                              value="MM/DD/YYYY"
                              checked={formatData.date_format === 'MM/DD/YYYY'}
                              onChange={(e) => setFormatData({ ...formatData, date_format: e.target.value })}
                            />
                            <span className="ml-2">MM/GG/AAAA</span>
                          </label>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label htmlFor="time_format_24" className="text-sm font-medium text-gray-700">Orario</label>
                        <div className="flex gap-4 mt-2">
                          <label htmlFor="time_format_24" className="flex items-center gap-2">
                            <input
                              id="time_format_24"
                              name="time_format_24"
                              type="radio"
                              value="24h"
                              checked={formatData.time_format === '24h'}
                              onChange={(e) => setFormatData({ ...formatData, time_format: e.target.value })}
                            />
                            <span className="ml-2">13:00</span>
                          </label>
                          <label htmlFor="time_format_12" className="flex items-center gap-2">
                            <input
                              id="time_format_12"
                              name="time_format_12"
                              type="radio"
                              value="12h"
                              checked={formatData.time_format === '12h'}
                              onChange={(e) => setFormatData({ ...formatData, time_format: e.target.value })}
                            />
                            <span className="ml-2">1:00 PM</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={handleClose}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                          disabled={saving}
                        >
                          Annulla
                        </button>
                        <button
                          onClick={handleSaveFormat}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                          disabled={saving}
                        >
                          {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                        </button>
                      </div>
                    </div>
                  )}
{/* 🆕 TAB REGISTRA UTENTE */}
{activeProfileTab === 'registra-utente' && (
  <div className="space-y-6">
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <UserPlus className="w-5 h-5 text-green-600" />
        <h3 className="font-medium text-gray-900">Registra Nuovo Utente</h3>
      </div>
      <p className="text-sm text-gray-600">
        Crea un nuovo account. L'utente dovrà essere approvato prima di accedere.
      </p>
    </div>

    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <form onSubmit={handleRegisterUser} className="space-y-4">
        {/* Nome Completo */}
        <div>
          <label htmlFor="register_name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome Completo *
          </label>
          <input
            id="register_name"
            type="text"
            required
            value={registerData.name}
            onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Mario Rossi"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="register_email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            id="register_email"
            type="email"
            required
            value={registerData.email}
            onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="mario.rossi@example.com"
          />
        </div>

        {/* Password */}
<div>
  <label htmlFor="register_password" className="block text-sm font-medium text-gray-700 mb-1">
    Password *
  </label>
  <div className="relative">
    <input
      id="register_password"
      type={showPassword ? "text" : "password"}
      required
      minLength={6}
      value={registerData.password}
      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
      className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      placeholder="Minimo 6 caratteri"
    />
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
    >
      {showPassword ? (
        <EyeOff className="w-5 h-5" />
      ) : (
        <Eye className="w-5 h-5" />
      )}
    </button>
  </div>
</div>

{/* Conferma Password */}
<div>
  <label htmlFor="register_confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
    Conferma Password *
  </label>
  <div className="relative">
    <input
      id="register_confirm_password"
      type={showConfirmPassword ? "text" : "password"}
      required
      minLength={6}
      value={registerData.confirmPassword}
      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
      className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      placeholder="Ripeti la password"
    />
    <button
      type="button"
      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
    >
      {showConfirmPassword ? (
        <EyeOff className="w-5 h-5" />
      ) : (
        <Eye className="w-5 h-5" />
      )}
    </button>
  </div>
  {registerData.password && registerData.confirmPassword && registerData.password !== registerData.confirmPassword && (
    <p className="text-red-600 text-sm mt-1">⚠️ Le password non coincidono</p>
  )}
</div>

        {/* Messaggio di info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            ℹ️ L'utente verrà creato con status "pending" e apparirà nella lista degli utenti in attesa di approvazione.
          </p>
        </div>

        {/* Messaggio di errore/successo */}
        {registerMessage && (
          <div className={`p-3 rounded-lg text-sm ${
            registerMessage.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {registerMessage.text}
          </div>
        )}

        {/* Pulsanti */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => {
              setRegisterData({ name: '', email: '', password: '', confirmPassword: '' });
              setRegisterMessage(null);
            }}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
            disabled={registerSaving}  // <-- Cambia qui
          >
            Resetta
          </button>
          <button
            type="submit"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            disabled={registerSaving || (registerData.password !== registerData.confirmPassword)} 
          >
            {registerSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registrazione...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Registra Utente
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
{/* 🆕 TAB UTENTI RIFIUTATI */}
{activeProfileTab === 'utenti-rifiutati' && (
  <div className="space-y-6">
        {console.log('🔍 Rendering tab rifiutati, rejectedUsers:', rejectedUsers)}
        {console.log('🔍 rejectedUsers.length:', rejectedUsers.length)}
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <XCircle className="w-5 h-5 text-red-600" />
        <h3 className="font-medium text-gray-900">Utenti Rifiutati</h3>
      </div>
      <p className="text-sm text-gray-600">
        Lista degli utenti che sono stati rifiutati
      </p>
    </div>

    {loadingUsers ? (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    ) : rejectedUsers.length === 0 ? (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Nessun utente rifiutato</p>
      </div>
    ) : (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Utente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Data Rifiuto
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rejectedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.full_name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(user.updated_at).toLocaleDateString('it-IT')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                   onClick={() => handleMoveToApproval(user.id, user.full_name, user.email)}
                   className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition ml-auto"
                 >
                   <Clock className="w-4 h-4" />
                   Metti in Approvazione
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    <div className="flex gap-3 pt-6 border-t border-gray-200">
      <button
        onClick={() => setShowProfileModal(false)}
        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
      >
        Chiudi
      </button>
      <button
        onClick={() => {
          // fetchRejectedUsers();
          toast.success('Lista aggiornata');
        }}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Aggiorna
      </button>
    </div>
  </div>
)}
                  {/* Contenuto dinamico basato sul tab attivo */}
                  {/* 🆕 TAB NOTIFICHE2 */}
                  {activeProfileTab === 'notifiche2' && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4">Notifiche</h2>

                      <div className="space-y-4 mb-6">
                        <div className="flex gap-4">
                          <label htmlFor="notify_email" className="flex items-center gap-2">
                            <input
                              id="notify_email"
                              name="notify_email"
                              type="checkbox"
                              checked={notificationsData.notify_new_campaigns || false}
                              onChange={(e) => setNotificationsData({ ...notificationsData, notify_new_campaigns: e.target.checked })}
                            />
                            <span className="ml-2">Email</span>
                          </label>
                          <label htmlFor="notify_push" className="flex items-center gap-2">
                            <input
                              id="notify_push"
                              name="notify_push"
                              type="checkbox"
                              checked={notificationsData.notify_push_new_tasks || false}
                              onChange={(e) => setNotificationsData({ ...notificationsData, notify_push_new_tasks: e.target.checked })}
                            />
                            <span className="ml-2">Push</span>
                          </label>
                        </div>

                        <div className="mt-4">
                          <label className="text-sm font-medium text-gray-700">Promemoria</label>
                          <div className="flex gap-4 mt-2">
                            <label htmlFor="reminder_weekly" className="flex items-center gap-2">
                              <input
                                id="reminder_weekly"
                                name="reminder_weekly"
                                type="checkbox"
                                checked={notificationsData.reminder_weekly_review || false}
                                onChange={(e) => setNotificationsData({ ...notificationsData, reminder_weekly_review: e.target.checked })}
                              />
                              <span className="ml-2">Review settimanale</span>
                            </label>
                            <label htmlFor="reminder_clock" className="flex items-center gap-2">
                              <input
                                id="reminder_clock"
                                name="reminder_clock"
                                type="checkbox"
                                checked={notificationsData.reminder_clock_in || false}
                                onChange={(e) => setNotificationsData({ ...notificationsData, reminder_clock_in: e.target.checked })}
                              />
                              <span className="ml-2">Ricordati di timbrare</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={handleClose}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                          disabled={saving}
                        >
                          Annulla
                        </button>
                        <button
                          onClick={handleSaveNotifications}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                          disabled={saving}
                        >
                          {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 🆕 TAB PRIVACY */}
                  {activeProfileTab === 'privacy' && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4">Privacy</h2>
                      <div className="flex gap-4 mt-2">
                        <label htmlFor="accept_offers" className="flex items-center gap-2">
                          <input
                            id="accept_offers"
                            name="accept_offers"
                            type="checkbox"
                            checked={privacyData}
                            onChange={(e) => setPrivacyData(e.target.checked)}
                          />
                          <span className="ml-2">Accetto di ricevere offerte</span>
                        </label>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={handleClose}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                          disabled={saving}
                        >
                          Annulla
                        </button>
                        <button
                          onClick={handleSavePrivacy}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                          disabled={saving}
                        >
                          {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Contenuto dinamico basato sul tab attivo */}
                  {/* 🆕 TAB CAMBIA PASSWORD */}
                  {activeProfileTab === 'cambia-password' && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4">Cambia la tua password</h2>

                      <div>
                        <label htmlFor="current_password" className="text-sm font-medium text-gray-700">Password attuale</label>
                        <input
                          id="current_password"
                          name="current_password"
                          type="password"
                          className="w-full p-3 border border-gray-300 rounded-lg mt-2"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        />
                      </div>

                      <div className="mt-4">
                        <label htmlFor="new_password" className="text-sm font-medium text-gray-700">Nuova password</label>
                        <input
                          id="new_password"
                          name="new_password"
                          type="password"
                          className="w-full p-3 border border-gray-300 rounded-lg mt-2"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        />
                      </div>

                      <div className="mt-4">
                        <label htmlFor="confirm_password" className="text-sm font-medium text-gray-700">Conferma nuova password</label>
                        <input
                          id="confirm_password"
                          name="confirm_password"
                          type="password"
                          className="w-full p-3 border border-gray-300 rounded-lg mt-2"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        />
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={() => {
                            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                            handleClose();
                          }}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                          disabled={saving}
                        >
                          Annulla
                        </button>
                        <button
                          onClick={handleChangePassword}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                          disabled={saving}
                        >
                          {saving ? 'Aggiornamento...' : 'Salva Modifiche'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Contenuto dinamico basato sul tab attivo */}
                  {activeProfileTab === 'notifiche' && (
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50">
                      {/* 🧭 Sezione introduttiva */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <h3 className="font-medium text-gray-900">Notifiche</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                          Configura come e quando ricevere le notifiche della piattaforma
                        </p>
                      </div>

                      {/* 🔔 Blocchi notifiche */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* 🔵 Notifiche Email */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-blue-600" />
                            Notifiche Email
                          </h4>

                          <div className="space-y-5">
                            {/* ✅ Nuove campagne */}
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">Nuove campagne</p>
                                <p className="text-sm text-gray-600">
                                  Ricevi notifiche per nuove campagne email
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={notificationsDataPrimary.notify_new_campaigns || false}
                                  onChange={(e) =>
                                    setNotificationsDataPrimary((prev) => ({
                                      ...prev,
                                      notify_new_campaigns: e.target.checked,
                                    }))
                                  }
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>

                            {/* ✅ Rapporti settimanali */}
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">Rapporti settimanali</p>
                                <p className="text-sm text-gray-600">
                                  Ricevi un riassunto settimanale delle tue campagne
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={notificationsDataPrimary.notify_report_weekly || false}
                                  onChange={(e) =>
                                    setNotificationsDataPrimary((prev) => ({
                                      ...prev,
                                      notify_report_weekly: e.target.checked,
                                    }))
                                  }
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* 🟢 Notifiche Push */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-green-600" />
                            Notifiche Push
                          </h4>

                          <div className="space-y-5">
                            {/* ✅ Campagne completate */}
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">Campagne completate</p>
                                <p className="text-sm text-gray-600">
                                  Notifica quando una campagna è stata inviata
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={notificationsDataPrimary.notify_campaign_results || false}
                                  onChange={(e) =>
                                    setNotificationsDataPrimary((prev) => ({
                                      ...prev,
                                      notify_campaign_results: e.target.checked,
                                    }))
                                  }
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>

                            {/* ✅ Nuovi contatti */}
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">Nuovi contatti</p>
                                <p className="text-sm text-gray-600">
                                  Notifica quando vengono aggiunti nuovi contatti
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={notificationsDataPrimary.notify_new_contacts || false}
                                  onChange={(e) =>
                                    setNotificationsDataPrimary((prev) => ({
                                      ...prev,
                                      notify_new_contacts: e.target.checked,
                                    }))
                                  }
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                            {/* 🧾 Informazioni Account */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-purple-600" />
                                Informazioni Account
                              </h4>
                              <div className="space-y-4">
                                <div>
                                  <label htmlFor="profile_name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Nome
                                  </label>
                                  <input
                                    id="profile_name"
                                    name="name"
                                    type="text"
                                    value={profileData.name}
                                    onChange={(e) =>
                                      setProfileData((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>

                                <div>
                                  <label htmlFor="profile_email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                  </label>
                                  <input
                                    id="profile_email"
                                    name="email"
                                    type="email"
                                    value={profileData.email}
                                    onChange={(e) =>
                                      setProfileData((prev) => ({ ...prev, email: e.target.value }))
                                    }
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>

                                <div>
                                  <label htmlFor="profile_role" className="block text-sm font-medium text-gray-700 mb-1">
                                    Ruolo
                                  </label>
                                  <input
                                    id="profile_role"
                                    name="role"
                                    type="text"
                                    value={profileData.role}
                                    disabled
                                    className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-gray-500"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* 🌍 Preferenze Generali */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-orange-600" />
                                Preferenze Generali
                              </h4>
                              <div className="space-y-4">
                                <div>
                                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                                    Lingua
                                  </label>
                                  <select
                                    id="language"
                                    name="language"
                                    value={profileData.language}
                                    onChange={(e) =>
                                      setProfileData((prev) => ({ ...prev, language: e.target.value }))
                                    }
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  >
                                    <option value="it">Italiano</option>
                                    <option value="en">English</option>
                                    <option value="es">Español</option>
                                    <option value="fr">Français</option>
                                  </select>
                                </div>

                                <div>
                                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                                    Fuso Orario
                                  </label>
                                  <select
                                    id="timezone"
                                    name="timezone"
                                    value={profileData.timezone}
                                    onChange={(e) =>
                                      setProfileData((prev) => ({ ...prev, timezone: e.target.value }))
                                    }
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  >
                                    <option value="Europe/Rome">Europa/Roma (GMT+1)</option>
                                    <option value="Europe/London">Europa/Londra (GMT)</option>
                                    <option value="America/New_York">America/New York (GMT-5)</option>
                                  </select>
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>

                      {/* ✅ Messaggio risultato */}
                      {resultMessage && (
                        <div
                          className={`mt-4 text-sm text-center ${resultMessage.type === 'success'
                              ? 'text-green-600'
                              : 'text-red-600'
                            }`}
                        >
                          {resultMessage.text}
                        </div>
                      )}

                      {/* 🔘 Pulsanti */}
                      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                        <button
                          onClick={handleClose}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                          disabled={saving}
                        >
                          Annulla
                        </button>

                        <button
                          onClick={handleSaveNotificationsPrimary}
                          disabled={saving}
                          className={`px-4 py-2 rounded-lg text-white transition-colors ${saving
                              ? 'bg-blue-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                          {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                        </button>
                      </div>
                    </div>
                  )}
{/* Tab predefinito per tutti */}
{activeProfileTab === 'info-profilo' && (
  <div className="space-y-6">
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="font-medium text-gray-900">Benvenuto nel tuo profilo</h3>
      <p className="text-sm text-gray-600">
        Gestisci le tue informazioni e preferenze dalla sidebar
      </p>
    </div>

    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
          <p className="text-gray-900">{user?.full_name || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <p className="text-gray-900">{user?.email || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo</label>
          <p className="text-gray-900">{user?.role?.name || 'user'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Registrato il</label>
          <p className="text-gray-900">{new Date(user?.created_at).toLocaleDateString('it-IT')}</p>
        </div>
      </div>
    </div>
  </div>
)}
                 {/* Tab Impostazioni - VISIBILE A TUTTI */}
{activeProfileTab === 'impostazioni' && (
  <div className="space-y-6">
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Settings className="w-5 h-5 text-blue-600" />
        <h3 className="font-medium text-gray-900">Impostazioni</h3>
      </div>
      <p className="text-sm text-gray-600">
        Gestisci le tue informazioni personali e preferenze
      </p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 🧾 Informazioni Account */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-purple-600" />
          Informazioni Account
        </h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={profileData.name || user?.full_name || ''}
              onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={profileData.email || user?.email || ''}
              disabled
              className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">L'email non può essere modificata</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo</label>
            <input
              type="text"
              value={user?.role?.name || 'user'}
              disabled
              className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* 🌍 Preferenze Generali */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-orange-600" />
          Preferenze
        </h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lingua</label>
            <select
              value={profileData.language || 'it'}
              onChange={(e) => setProfileData((prev) => ({ ...prev, language: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="it">Italiano</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fuso Orario</label>
            <select
              value={profileData.timezone || 'Europe/Rome'}
              onChange={(e) => setProfileData((prev) => ({ ...prev, timezone: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Europe/Rome">Europa/Roma (GMT+1)</option>
              <option value="Europe/London">Europa/Londra (GMT)</option>
              <option value="America/New_York">America/New York (GMT-5)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 🔐 Impostazioni SMTP - SOLO ADMIN */}
      {(user?.role?.name === 'admin' || user?.role?.name === 'super_admin') && (
        <>
          {/* Configurazione Email */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Configurazione Email
            </h4>
            <div className="space-y-4">
              <div>
                <label htmlFor="smtp_server" className="block text-sm font-medium text-gray-700 mb-1">Server SMTP</label>
                <input
                  id="smtp_server"
                  type="text"
                  value={systemSettings.smtp_server || ''}
                  onChange={(e) => setSystemSettings({ ...systemSettings, smtp_server: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="smtp_port" className="block text-sm font-medium text-gray-700 mb-1">Porta SMTP</label>
                <input
                  id="smtp_port"
                  type="number"
                  value={systemSettings.smtp_port || ''}
                  onChange={(e) => setSystemSettings({ ...systemSettings, smtp_port: parseInt(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="sender_email" className="block text-sm font-medium text-gray-700 mb-1">Email Mittente</label>
                <input
                  id="sender_email"
                  type="email"
                  value={systemSettings.sender_email || ''}
                  onChange={(e) => setSystemSettings({ ...systemSettings, sender_email: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Sicurezza Account */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Sicurezza
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Autenticazione a due fattori</p>
                  <p className="text-sm text-gray-600">Aumenta la sicurezza</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={systemSettings.two_factor_enabled || false}
                    onChange={(e) => setSystemSettings({ ...systemSettings, two_factor_enabled: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Login automatico</p>
                  <p className="text-sm text-gray-600">Ricorda per 30 giorni</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={systemSettings.auto_login || false}
                    onChange={(e) => setSystemSettings({ ...systemSettings, auto_login: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </>
      )}
    </div>

    {/* Pulsanti */}
    <div className="flex gap-3 pt-6 border-t border-gray-200">
      <button
        onClick={() => setShowProfileModal(false)}
        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
        disabled={saving}
      >
        Annulla
      </button>
      <button
        onClick={(user?.role?.name === 'admin' || user?.role?.name === 'super_admin') ? handleSaveSystemSettings : handleSaveProfile}
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        disabled={saving}
      >
        {saving ? 'Salvataggio...' : 'Salva Modifiche'}
      </button>
    </div>
  </div>
)}

{/* 🆕 TAB GESTIONE UTENTI IN ATTESA */}
{activeProfileTab === 'gestione-utenti' && (
  <div className="space-y-6">
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-5 h-5 text-yellow-600" />
        <h3 className="font-medium text-gray-900">Utenti in Attesa di Approvazione</h3>
      </div>
      <p className="text-sm text-gray-600">
        Approva o rifiuta le richieste di registrazione degli utenti
      </p>
    </div>

    {loadingUsers ? (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    ) : pendingUsers.length === 0 ? (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Nessun utente in attesa di approvazione</p>
      </div>
    ) : (
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Utente
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Data Registrazione
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Stato
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">
                                Azioni
                              </th>
                            </tr>
                          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pendingUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                      user.status === 'approved' 
                        ? 'bg-green-100' 
                        : user.status === 'rejected'
                        ? 'bg-red-100'
                        : 'bg-yellow-100'
                    }`}>
                      <User className={`w-5 h-5 ${
                        user.status === 'approved'
                          ? 'text-green-600'
                          : user.status === 'rejected'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`} />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.full_name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(user.created_at).toLocaleDateString('it-IT')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {user.status === 'approved' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3" />
                      Approvato
                    </span>
                  ) : user.status === 'rejected' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircle className="w-3 h-3" />
                      Rifiutato
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="w-3 h-3" />
                      In Attesa
                    </span>
                  )}
                         </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    {/* Mostra Approva per pending e rejected */}
                    {user.status !== 'approved' && (
                      <button
                        onClick={() => handleApproveUser(user.id, user.full_name, user.email)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                        title={user.status === 'rejected' ? 'Riapprova' : 'Approva'}
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span className="hidden xl:inline">{user.status === 'rejected' ? 'Riapprova' : 'Approva'}</span>
                      </button>
                    )}
                    {/* Mostra Rifiuta per pending e approved */}
                    {user.status !== 'rejected' && (
                      <button
                        onClick={() => handleRejectUser(user.id, user.full_name, user.email)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                        title="Rifiuta"
                      >
                      <XCircle className="w-3 h-3" />
                      <span className="hidden xl:inline">Rifiuta</span>
                       
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    <div className="flex gap-3 pt-6 border-t border-gray-200">
      <button
        onClick={handleClose}
        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
      >
        Chiudi
      </button>
      <button
        onClick={() => {
          fetchPendingUsers();
          toast.success('Lista aggiornata');
        }}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Aggiorna
      </button>
    </div>
  </div>
)}

{/* 🆕 TAB GESTIONE PERMESSI UTENTI */}
{activeProfileTab === 'gestione-permessi' && (
  <div className="space-y-6">
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-5 h-5 text-purple-600" />
        <h3 className="font-medium text-gray-900">Gestione Permessi e Ruoli</h3>
      </div>
      <p className="text-sm text-gray-600">
        Modifica ruoli e permessi degli utenti approvati
      </p>
    </div>

    {loadingUsers ? (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    ) : approvedUsers.length === 0 ? (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Nessun utente approvato</p>
      </div>
    ) : (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Utente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ruolo Attuale
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {approvedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.full_name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role_id || ''}
                    onChange={(e) => handleChangeUserRole(user.id, e.target.value, user.full_name)}
                    className="text-sm border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Nessun ruolo</option>
                    {availableRoles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.status}
                    onChange={(e) => handleChangeUserStatus(user.id, e.target.value, user.full_name)}
                    className={`text-sm border rounded px-3 py-1.5 focus:ring-2 focus:ring-blue-500 ${
                      user.status === 'active' 
                        ? 'bg-green-50 border-green-300 text-green-800'
                        : 'bg-gray-50 border-gray-300 text-gray-700'
                    }`}
                  >
                    <option value="approved">Approvato</option>
                    <option value="active">Attivo</option>
                    <option value="inactive">Inattivo</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role?.name === 'super_admin' 
                        ? 'bg-purple-100 text-purple-800'
                        : user.role?.name === 'admin'
                        ? 'bg-blue-100 text-blue-800'
                        : user.role?.name === 'editor'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role?.name || 'No role'}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    <div className="flex gap-3 pt-6 border-t border-gray-200">
      <button
        onClick={handleClose}
        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
      >
        Chiudi
      </button>
      <button
        onClick={() => {
          fetchApprovedUsers();
          toast.success('Lista aggiornata');
        }}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Aggiorna
      </button>
    </div>
  </div>
)}
                </div>
                              </div>
                              {/* 🆕 Modal Conferma Rifiuto */}
{showRejectModal && userToReject && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl animate-fadeIn">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <XCircle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Conferma Rifiuto</h3>
          <p className="text-sm text-gray-600">Questa azione è definitiva</p>
        </div>
      </div>

      <div className="bg-red-50 rounded-lg p-4 mb-6 border border-red-200">
        <p className="text-sm text-red-800 mb-2">
          ⚠️ Stai per rifiutare l'utente:
        </p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{userToReject.name}</p>
            <p className="text-sm text-gray-600">{userToReject.email}</p>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        L'utente verrà contrassegnato come "rifiutato" e riceverà una notifica via email.
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => {
            setShowRejectModal(false);
            setUserToReject(null);
          }}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
        >
          Annulla
        </button>
        <button
          onClick={confirmRejectUser}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <XCircle className="w-4 h-4" />
          Rifiuta Utente
        </button>
      </div>
    </div>
  </div>
)}
                              {/* 🎨 MODALE MODIFICA PROFILO */}
{showEditProfile && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Edit3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Modifica Profilo</h3>
              <p className="text-blue-100 text-sm">Aggiorna le tue informazioni personali</p>
            </div>
          </div>
          <button
            onClick={() => setShowEditProfile(false)}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
              {editProfileData.avatar ? (
                <img 
                  src={URL.createObjectURL(editProfileData.avatar)} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                getUserInitials(editProfileData.name || user?.email)
              )}
            </div>
            
            <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition shadow-lg">
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setEditProfileData({
                      ...editProfileData,
                      avatar: e.target.files[0]
                    });
                  }
                }}
              />
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">Clicca per cambiare foto</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome completo
            </label>
            <input
              type="text"
              value={editProfileData.name}
              onChange={(e) => setEditProfileData({ ...editProfileData, name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="Il tuo nome"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={editProfileData.email}
              onChange={(e) => setEditProfileData({ ...editProfileData, email: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="email@esempio.com"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              value={editProfileData.bio}
              onChange={(e) => setEditProfileData({ ...editProfileData, bio: e.target.value })}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
              placeholder="Raccontaci qualcosa di te..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {editProfileData.bio.length}/200 caratteri
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-gray-50 border-t flex gap-3">
        <button
          onClick={() => setShowEditProfile(false)}
          disabled={saving || uploadingAvatar}
          className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition font-medium disabled:opacity-50"
        >
          Annulla
        </button>
        <button
          onClick={handleSaveProfile}
          disabled={saving || uploadingAvatar}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving || uploadingAvatar ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {uploadingAvatar ? 'Caricamento...' : 'Salvataggio...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salva Modifiche
            </>
          )}
        </button>
      </div>
    </motion.div>
  </div>
)}

{/* 🆕 Modal Conferma Metti in Approvazione */}
{showMoveToApprovalModal && userToMoveToApproval && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl animate-fadeIn">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
          <Clock className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Metti in Approvazione</h3>
          <p className="text-sm text-gray-600">L'utente tornerà in attesa</p>
        </div>
      </div>

      <div className="bg-yellow-50 rounded-lg p-4 mb-6 border border-yellow-200">
        <p className="text-sm text-yellow-800 mb-2">
          📋 Stai per rimettere in approvazione:
        </p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{userToMoveToApproval.name}</p>
            <p className="text-sm text-gray-600">{userToMoveToApproval.email}</p>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        L'utente tornerà nella lista "Utenti in Attesa" e potrà essere approvato nuovamente.
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => {
            setShowMoveToApprovalModal(false);
            setUserToMoveToApproval(null);
          }}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
        >
          Annulla
        </button>
        <button
          onClick={confirmMoveToApproval}
          className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Clock className="w-4 h-4" />
          Metti in Approvazione
        </button>
      </div>
    </div>
  </div>
)}
                              <AnimatePresence>
      {showCloseConfirm && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 40 }}
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 25,
              duration: 0.35,
            }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              ⚠️ Sei sicuro di voler chiudere?
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Le modifiche non salvate andranno perse.
            </p>
    
            <div className="flex justify-end gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={cancelClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Annulla
              </motion.button>
    
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={confirmClose}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Sì, chiudi
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
            </div>  
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Mail className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">MailMassProm</h1>
            </div>
            <div className="flex items-center gap-4">
              {/* Notifiche */}
              <div className="relative">
                <button
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                  className="relative p-2 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  title={`Hai ${unreadNotifications} notifiche non lette`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {unreadNotifications}
                    </span>
                  )}
                </button>

                {/* Dropdown notifiche */}
                {showNotificationDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b border-gray-100 font-semibold text-gray-700">
                      Notifiche
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div key={notif.id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                            <p className="text-sm text-gray-800">{notif.title}</p>
                            <p className="text-xs text-gray-500">{notif.date}</p>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                          Nessuna nuova notifica
                        </div>
                      )}
                    </div>
                    <div className="p-2 border-t border-gray-100 text-center">
                      <button
                        onClick={() => {
                          // setActiveProfileTab("notifiche");
                          // setShowProfileModal(true);
                          setShowNotificationDropdown(false);
                          setUnreadNotifications(0);
                          setShowAllNotificationsModal(true);
                        }}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Vai a tutte le notifiche
                      </button>
                    </div>
                  </div>
                )}
          </div>
          
              {showAllNotificationsModal && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-lg relative">
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 border-b border-gray-200">
                      <h2 className="text-xl font-bold text-gray-900">Tutte le notifiche</h2>
                      <button
                        onClick={() => setShowAllNotificationsModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Lista notifiche */}
                    <div className="divide-y divide-gray-100">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div key={notif.id} className="p-4 hover:bg-gray-50 transition">
                            <p className="text-gray-800 font-medium">{notif.title}</p>
                            <p className="text-gray-500 text-sm">{notif.date}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-gray-500">
                          Nessuna notifica disponibile.
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end p-4 border-t border-gray-200">
                      <button
                        onClick={() => setShowAllNotificationsModal(false)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
                      >
                        Chiudi
                      </button>
                    </div>
                  </div>
                </div>
              )}


              {/* Menu Utente */}
              <div className="relative user-menu">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {getUserInitials(user?.name)}
                  </div>

                  {/* Nome utente */}
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.name || 'Massimo'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user?.email}
                    </div>
                  </div>

                  {/* Freccia dropdown */}
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''
                    }`} />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {/* Header utente nel dropdown */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                          {getUserInitials(user?.name)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user?.name || 'Massimo'}</div>
                          <div className="text-sm text-gray-500">{user?.email}</div>
                          {user?.isAdmin && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowProfileModal(true);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Il mio profilo
                      </button>

                      {/* <button
                        onClick={() => {
                          setShowUserMenu(false);
                          alert('Funzionalità impostazioni in arrivo!');
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Impostazioni
                      </button> */}

                      <div className="border-t border-gray-100 my-2"></div>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowLogoutConfirm(true); // ✅ Apri modale elegante
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Esci
                      </button>

                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div className="flex gap-8">
    {/* Sidebar */}
    <div className="w-64 flex-shrink-0 space-y-6">
      <nav className="space-y-2">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "dashboard"
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <BarChart3 className="w-5 h-5 mr-3" />
          Dashboard
        </button>

        <button
          onClick={() => setActiveTab("campaigns")}
          className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "campaigns"
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Mail className="w-5 h-5 mr-3" />
          Campagne
        </button>

        <button
          onClick={() => setActiveTab("contacts")}
          className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "contacts"
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Users className="w-5 h-5 mr-3" />
          Contatti
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "logs"
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <BarChart3 className="w-5 h-5 mr-3" />
          Storico Invii
        </button>
{/* Solo per admin e super_admin */}
{(currentUser?.role?.name === 'admin' || currentUser?.role?.name === 'super_admin') && (
              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === "settings"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <span className="flex items-center">
                  <Settings className="w-5 h-5 mr-3" />
                  Impostazioni Email
                </span>

                {/* 🔴 BADGE QUEUE */}
                {queueCount > 0 && (
                  <span className="bg-red-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full animate-pulse">
                    {queueCount}
                  </span>
                )}
              </button>
      )}        
      </nav>
 {/* Widget Ultimi Invii */}
     
<div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
      <Send className="w-4 h-4 text-blue-600" /> Ultimi Invii
    </h3>
    <button
      onClick={() => setActiveTab("logs")}
      className="text-xs text-blue-600 hover:text-blue-800 transition"
    >
      Vedi tutti
    </button>
  </div>

  <div className="divide-y divide-gray-100">
    {(() => {
      const logs = latestLogsForWidget;
      
      if (!logs.length)
        return (
          <div className="p-4 text-gray-500 text-xs italic">
            Nessun invio recente
          </div>
        );

      return logs.map((log) => {
        const recipientsCount = log.total_recipients || 0;
        const openedCount = log.opened_count || 0;
        const openRate =
          recipientsCount > 0
            ? Math.round((openedCount / recipientsCount) * 100)
            : 0;

        const getBarColor = () => {
          if (log.status === "sending")
            return "bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400 animate-pulse-bar";
          if (openRate >= 50) return "bg-green-500";
          if (openRate >= 20) return "bg-yellow-500";
          return "bg-red-500";
        };

        return (
          <div 
            key={log.id} 
            className="p-4 hover:bg-gray-50 transition cursor-pointer"
            onClick={() => setSelectedLogForModal(log)}
          >
            {/* Nome Campagna */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {log.campaign_name || log.subject}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {log.subject}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedLogForModal(log);
                }}
                className="ml-2 p-1.5 hover:bg-gray-200 rounded-lg transition"
              >
                <Users className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Account mittente */}
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-600 truncate">
                {log.sender_email || "Account non specificato"}
              </span>
            </div>

            {/* Data, ora e destinatari */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>
                  {log.sent_at
                    ? new Date(log.sent_at).toLocaleString("it-IT", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span className="font-medium">{recipientsCount}</span>
              </div>
            </div>

            {/* Barra progresso aperture */}
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Tasso di apertura</span>
                <span className="font-medium">{openRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden relative">
                <div
                  className={`h-1.5 ${getBarColor()} rounded-full transition-all duration-700`}
                  style={{
                    width:
                      log.status === "sending" ? "100%" : `${openRate}%`,
                  }}
                ></div>
                {log.status === "sending" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-wave"></div>
                )}
              </div>
            </div>
          </div>
        );
      });
    })()}
  </div>
</div>
 {/* Modale Modifica Contatto */}
 {/* {showEditModal && editingContact && (
  <EditContactModal
  show={showEditModal}  // 🔥 AGGIUNGI QUESTA RIGA!
    contact={editingContact}
    onClose={() => {
      setShowEditModal(false);
      setEditingContact(null);
    }}
    onSave={handleUpdateContact}
    tags={tags}
    sectors={sectors}
    channels={channels}
    roles={roles}
    onOpenSectorsModal={() => setShowSectorsModal(true)}
    onOpenChannelsModal={() => setShowChannelsModal(true)}
    onOpenRolesModal={() => setShowRolesModal(true)}
  />
)} */}
 {/* Alla fine del return, con gli altri modali */}
 {showSectorsModal && (
  <SectorsManagementModal
    show={showSectorsModal}
    onClose={() => {
      console.log('🟠 Chiusura SectorsModal');
      
      setShowSectorsModal(false);
      fetchSectors();
      console.log('🟠 Sectors ricaricati');
      
    }}
    user={user}
  />
)}

{showChannelsModal && (
  <ChannelsManagementModal
    show={showChannelsModal}
    onClose={() => {
      console.log('🟠 Chiusura ChannelsModal');
      
      setShowChannelsModal(false);
      fetchChannels();
      console.log('🟠 Channels ricaricati');
       
    }}
    user={user}
  />
)}

{showRolesModal && (
  <RolesManagementModal
    show={showRolesModal}
    onClose={() => {
      console.log('🟠 Chiusura RolesModal');
      
      setShowRolesModal(false);
      fetchRoles();
      console.log('🟠 Roles ricaricati');
      
    }}
    user={user}
  />
)}
{/* 📋 MODALE DETTAGLIO LOG CON DESTINATARI */}
{selectedLogForModal && (
  <div 
    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    onClick={() => setSelectedLogForModal(null)}
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">
                {selectedLogForModal.campaign_name || selectedLogForModal.subject}
              </h3>
              <p className="text-blue-100 text-sm">
                Inviata il{" "}
                {new Date(selectedLogForModal.sent_at).toLocaleString("it-IT", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedLogForModal(null)}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
        {/* Info campagna */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Mail className="w-4 h-4" />
              <span className="text-xs font-medium">Account Mittente</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {selectedLogForModal.sender_email || "Non specificato"}
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">Destinatari</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {selectedLogForModal.total_recipients || 0}
            </p>
          </div>
        </div>

        {/* Oggetto */}
        <div className="mb-6">
          <label className="text-xs font-medium text-gray-600 mb-2 block">
            Oggetto
          </label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm text-gray-900">{selectedLogForModal.subject}</p>
          </div>
        </div>

        {/* Lista Destinatari */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-3 block flex items-center justify-between">
            <span>Lista Destinatari ({selectedLogForModal.recipient_list?.length || 0})</span>
            <button
              onClick={() => {
                const emails = selectedLogForModal.recipient_list?.join("\n");
                navigator.clipboard.writeText(emails);
                toast.success("📋 Email copiate negli appunti!");
              }}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              Copia tutte
            </button>
          </label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
            {selectedLogForModal.recipient_list && selectedLogForModal.recipient_list.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {selectedLogForModal.recipient_list.map((email, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 hover:bg-white transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                      {email.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-700 flex-1">{email}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(email);
                        toast.success("📋 Email copiata!");
                      }}
                      className="p-1.5 hover:bg-gray-200 rounded transition"
                    >
                      <Copy className="w-3 h-3 text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                Nessun destinatario trovato
              </div>
            )}
          </div>
        </div>

        {/* CC e BCC se presenti */}
        {(selectedLogForModal.cc?.length > 0 || selectedLogForModal.bcc?.length > 0) && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            {selectedLogForModal.cc?.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">
                  CC ({selectedLogForModal.cc.length})
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-700">
                  {selectedLogForModal.cc.join(", ")}
                </div>
              </div>
            )}
            {selectedLogForModal.bcc?.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">
                  BCC ({selectedLogForModal.bcc.length})
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-700">
                  {selectedLogForModal.bcc.join(", ")}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 bg-gray-50 border-t flex justify-end">
        <button
          onClick={() => setSelectedLogForModal(null)}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition font-medium"
        >
          Chiudi
        </button>
      </div>
    </motion.div>
  </div>
)}
    </div>
   
 {/* 🆕 Modal Conferma Approvazione */}
{showApproveModal && userToApprove && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl animate-fadeIn">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Conferma Approvazione</h3>
          <p className="text-sm text-gray-600">Questa azione non può essere annullata</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-700 mb-2">
          Stai per approvare l'utente:
        </p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{userToApprove.name}</p>
            <p className="text-sm text-gray-600">{userToApprove.email}</p>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        L'utente riceverà accesso completo alla piattaforma e potrà effettuare il login.
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => {
            setShowApproveModal(false);
            setUserToApprove(null);
          }}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
        >
          Annulla
        </button>
        <button
          onClick={confirmApproveUser}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Approva Utente
        </button>
      </div>
    </div>
  </div>
)}


{/* 🆕 Modal Conferma Rifiuto */}
{showRejectModal && userToReject && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl animate-fadeIn">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <XCircle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Conferma Rifiuto</h3>
          <p className="text-sm text-gray-600">Questa azione è definitiva</p>
        </div>
      </div>

      <div className="bg-red-50 rounded-lg p-4 mb-6 border border-red-200">
        <p className="text-sm text-red-800 mb-2">
          ⚠️ Stai per rifiutare l'utente:
        </p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{userToReject.name}</p>
            <p className="text-sm text-gray-600">{userToReject.email}</p>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        L'utente verrà contrassegnato come "rifiutato" e riceverà una notifica via email.
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => {
            setShowRejectModal(false);
            setUserToReject(null);
          }}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
        >
          Annulla
        </button>
        <button
          onClick={confirmRejectUser}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <XCircle className="w-4 h-4" />
          Rifiuta Utente
        </button>
      </div>
    </div>
  </div>
)}

{/* 🚪 MODALE CONFERMA LOGOUT ELEGANTE */}
{showLogoutConfirm && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[99999] p-4"
    onClick={() => setShowLogoutConfirm(false)}
  >
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 20 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
    >
      {/* Header con gradiente */}
      <div className="bg-gradient-to-br from-red-500 to-pink-600 p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <LogOut className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Conferma Logout</h3>
            <p className="text-red-100 text-sm mt-1">Stai per uscire dall'account</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
          <p className="text-gray-700 text-sm leading-relaxed">
            Sei sicuro di voler uscire? Dovrai effettuare nuovamente il login per accedere alla piattaforma.
          </p>
        </div>

        {/* User info */}
        {user?.email && (
          <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.email}
              </p>
              <p className="text-xs text-gray-500">Account attivo</p>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowLogoutConfirm(false)}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition font-medium text-sm"
          >
            Annulla
          </button>
          <button
            onClick={() => {
              setShowLogoutConfirm(false);
              handleLogout();
            }}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl transition font-medium shadow-lg shadow-red-500/30 text-sm flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Esci
          </button>
        </div>
      </div>
    </motion.div>
  </motion.div>
)}
    {/* Main Content */}
{/* Main Content */}
<div className="flex-1">

  {activeTab === "dashboard" && (
    <Dashboard setActiveTab={setActiveTab} />
  )}

  {activeTab === "campaigns" && (
    <Campaigns
      setActiveTab={setActiveTab}
      contacts={contacts}
    />
  )}

  {activeTab === "campaigns-list" && (
    <CampaignsList setActiveTab={setActiveTab} />
  )}

  {activeTab === "contacts" && <Contacts />}
  {activeTab === "logs" && <EmailLogs />}
  {activeTab === "settings" && <EmailSettings />}

</div>


  </div>
</div>

     {/* Modals */} <ContactModal /> <ProfileModal />
    </div>
  );
};

// 🏷️ MODALE GESTIONE TAG COMPLETO
const TagsManagementModal = ({ show, onClose, user }) => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTag, setEditingTag] = useState(null);
  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');
  const [searchTag, setSearchTag] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [expandedTag, setExpandedTag] = useState(null);
  const [tagContacts, setTagContacts] = useState({});
  const [selectedContact, setSelectedContact] = useState(null);
  const [showCancelEditConfirm, setShowCancelEditConfirm] = useState(false);

  const colorOptions = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#06b6d4',
  ];

  // Carica tag
  const fetchTags = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .order('label');

      if (error) throw error;
      setTags(data || []);
      
      await loadContactsForTags(data || []);
    } catch (error) {
      console.error('❌ Errore caricamento tag:', error);
      toast.error('Errore nel caricamento dei tag');
    } finally {
      setLoading(false);
    }
  };

// Carica contatti per ogni tag
const loadContactsForTags = async (tagsList) => {
  if (!user?.id) return;

  try {
    // 🔥 USA contacts_full per avere tutti i campi
    const { data, error } = await supabase
      .from('contacts_full')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    const contactsByTag = {};
    
    tagsList.forEach(tag => {
      contactsByTag[tag.id] = data.filter(contact => 
        contact.tags && contact.tags.includes(tag.value)
      );
    });

    setTagContacts(contactsByTag);
  } catch (error) {
    console.error('❌ Errore caricamento contatti:', error);
  }
};

  useEffect(() => {
    if (show && user?.id) {
      fetchTags();
    }
  }, [show, user?.id]);

  const openContactDetail = (contact) => {
    setSelectedContact(contact);
  };

  const closeContactDetail = () => {
    setSelectedContact(null);
  };

  const toggleExpand = (tagId) => {
    setExpandedTag(expandedTag === tagId ? null : tagId);
  };

  // Aggiungi tag
  const handleAddTag = async () => {
    if (!newTagLabel.trim()) {
      toast.error('⚠️ Inserisci un nome per il tag');
      return;
    }

    if (!user?.id) return;

    try {
      const value = newTagLabel.trim().toLowerCase().replace(/\s+/g, '-');

      const { error } = await supabase
        .from('tags')
        .insert({
          id: crypto.randomUUID(),
          user_id: user.id,
          label: newTagLabel.trim(),
          value: value,
          color: newTagColor,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('✅ Tag creato con successo!');
      setNewTagLabel('');
      setNewTagColor('#3b82f6');
      await fetchTags();
    } catch (error) {
      console.error('❌ Errore creazione tag:', error);
      toast.error('Errore nella creazione del tag');
    }
  };

  // Modifica tag
  const handleUpdateTag = async () => {
    if (!editingTag) return;

    try {
      const { error } = await supabase
        .from('tags')
        .update({
          label: editingTag.label,
          value: editingTag.label.toLowerCase().replace(/\s+/g, '-'),
          color: editingTag.color,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingTag.id);

      if (error) throw error;

      toast.success('✅ Tag aggiornato!');
      setEditingTag(null);
      await fetchTags();
    } catch (error) {
      console.error('❌ Errore aggiornamento tag:', error);
      toast.error('Errore nell\'aggiornamento del tag');
    }
  };

  // Elimina tag
  const handleDeleteTag = async (tagId) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;

      toast.success('✅ Tag eliminato!');
      setShowDeleteConfirm(null);
      await fetchTags();
    } catch (error) {
      console.error('❌ Errore eliminazione tag:', error);
      toast.error('Errore nell\'eliminazione del tag');
    }
  };

  const filteredTags = tags.filter(tag =>
    tag.label.toLowerCase().includes(searchTag.toLowerCase())
  );

  // 🖨️ Funzione di stampa
const handlePrint = () => {
  // Crea contenuto HTML per la stampa
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Lista Tag - ${new Date().toLocaleDateString('it-IT')}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #1a1a1a;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #6366f1;
        }
        .header h1 {
          font-size: 28px;
          color: #6366f1;
          margin-bottom: 10px;
        }
        .header p {
          color: #666;
          font-size: 14px;
        }
        .tag-item {
          page-break-inside: avoid;
          margin-bottom: 30px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        .tag-header {
          padding: 15px 20px;
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .tag-color {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          flex-shrink: 0;
        }
        .tag-info {
          flex: 1;
        }
        .tag-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .tag-meta {
          font-size: 12px;
          color: #666;
        }
        .contacts-section {
          background: #f9fafb;
          padding: 15px 20px;
          border-top: 1px solid #e5e7eb;
        }
        .contacts-title {
          font-size: 14px;
          font-weight: bold;
          color: #374151;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .contact-item {
          background: white;
          padding: 12px 15px;
          margin-bottom: 8px;
          border-radius: 6px;
          border-left: 3px solid #6366f1;
        }
        .contact-name {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 3px;
        }
        .contact-email {
          font-size: 12px;
          color: #6b7280;
        }
        .contact-details {
          margin-top: 5px;
          font-size: 11px;
          color: #9ca3af;
        }
        .no-contacts {
          text-align: center;
          padding: 20px;
          color: #9ca3af;
          font-style: italic;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
        }
        @media print {
          body {
            padding: 10px;
          }
          .tag-item {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📋 Lista Tag con Contatti</h1>
        <p>Generato il ${new Date().toLocaleDateString('it-IT', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
      </div>

      ${filteredTags.map(tag => {
        const contacts = tagContacts[tag.id] || [];
        return `
          <div class="tag-item">
            <div class="tag-header" style="background-color: ${tag.color}15;">
              <div class="tag-color" style="background-color: ${tag.color};"></div>
              <div class="tag-info">
                <div class="tag-name" style="color: ${tag.color};">${tag.label}</div>
                <div class="tag-meta">
                  ${contacts.length} ${contacts.length === 1 ? 'contatto' : 'contatti'} • 
                  Creato il ${new Date(tag.created_at).toLocaleDateString('it-IT')}
                </div>
              </div>
            </div>
            
            <div class="contacts-section">
              <div class="contacts-title">Contatti associati:</div>
              ${contacts.length > 0 ? contacts.map(contact => `
                <div class="contact-item">
                  <div class="contact-name">${contact.name}</div>
                  <div class="contact-email">${contact.email}</div>
                  ${contact.ruolo || contact.settore || contact.canale ? `
                    <div class="contact-details">
                      ${contact.ruolo ? `Ruolo: ${contact.ruolo}` : ''}
                      ${contact.ruolo && (contact.settore || contact.canale) ? ' • ' : ''}
                      ${contact.settore ? `Settore: ${contact.settore}` : ''}
                      ${contact.settore && contact.canale ? ' • ' : ''}
                      ${contact.canale ? `Canale: ${contact.canale}` : ''}
                    </div>
                  ` : ''}
                </div>
              `).join('') : '<div class="no-contacts">Nessun contatto associato a questo tag</div>'}
            </div>
          </div>
        `;
      }).join('')}

      <div class="footer">
        <p>MailMassProm - Gestione Tag • Totale tag: ${filteredTags.length}</p>
      </div>
    </body>
    </html>
  `;

  // Apri finestra di stampa
  const printWindow = window.open('', '_blank');
  printWindow.document.write(printContent);
  printWindow.document.close();
  
  // Attendi che il contenuto sia caricato prima di stampare
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
};

// 🖨️ Funzione stampa dettaglio contatto
const handlePrintContact = () => {
  if (!selectedContact) return;

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Contatto - ${selectedContact.name}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          padding: 30px;
          color: #1a1a1a;
          background: white;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #3b82f6;
        }
        .header h1 {
          font-size: 32px;
          color: #3b82f6;
          margin-bottom: 5px;
        }
        .header .email {
          color: #666;
          font-size: 16px;
        }
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #3b82f6;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e5e7eb;
        }
        .field-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .field {
          margin-bottom: 15px;
        }
        .field-label {
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        .field-value {
          font-size: 14px;
          color: #1f2937;
          font-weight: 500;
        }
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }
        .status-active {
          background: #d1fae5;
          color: #065f46;
        }
        .status-inactive {
          background: #f3f4f6;
          color: #374151;
        }
        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }
        .tag {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
        }
        .channel-info {
          background: #eff6ff;
          padding: 20px;
          border-radius: 10px;
          border-left: 4px solid #3b82f6;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
        }
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${selectedContact.name}</h1>
        <p class="email">${selectedContact.email}</p>
      </div>

      <div class="section">
        <div class="section-title">👤 Informazioni Contatto</div>
        <div class="field-grid">
          <div class="field">
            <div class="field-label">Nome</div>
            <div class="field-value">${selectedContact.name || '-'}</div>
          </div>
          <div class="field">
            <div class="field-label">Email</div>
            <div class="field-value">${selectedContact.email || '-'}</div>
          </div>
          ${selectedContact.ruolo ? `
            <div class="field">
              <div class="field-label">Ruolo</div>
              <div class="field-value">${selectedContact.ruolo}</div>
            </div>
          ` : ''}
          ${selectedContact.settore ? `
            <div class="field">
              <div class="field-label">Settore</div>
              <div class="field-value">${selectedContact.settore}</div>
            </div>
          ` : ''}
          ${selectedContact.canale ? `
            <div class="field">
              <div class="field-label">Canale</div>
              <div class="field-value">${selectedContact.canale}</div>
            </div>
          ` : ''}
          ${selectedContact.status ? `
            <div class="field">
              <div class="field-label">Status</div>
              <div class="field-value">
                <span class="status-badge ${selectedContact.status === 'active' ? 'status-active' : 'status-inactive'}">
                  ${selectedContact.status}
                </span>
              </div>
            </div>
          ` : ''}
        </div>
      </div>

      ${(selectedContact.tipologia_canale || selectedContact.periodicita_canale || selectedContact.copertura_canale) ? `
        <div class="section">
          <div class="section-title">📡 Dettagli Canale</div>
          <div class="channel-info">
            <div class="field-grid">
              ${selectedContact.tipologia_canale ? `
                <div class="field">
                  <div class="field-label">Tipologia</div>
                  <div class="field-value">${selectedContact.tipologia_canale}</div>
                </div>
              ` : ''}
              ${selectedContact.periodicita_canale ? `
                <div class="field">
                  <div class="field-label">Periodicità</div>
                  <div class="field-value">${selectedContact.periodicita_canale}</div>
                </div>
              ` : ''}
              ${selectedContact.copertura_canale ? `
                <div class="field">
                  <div class="field-label">Copertura</div>
                  <div class="field-value">${selectedContact.copertura_canale}</div>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      ` : ''}

      ${selectedContact.tags && selectedContact.tags.length > 0 ? `
        <div class="section">
          <div class="section-title">🏷️ Tag Associati</div>
          <div class="tags-container">
            ${selectedContact.tags.map(tagValue => {
              const tagInfo = tags.find(t => t.value === tagValue);
              if (tagInfo) {
                return `<span class="tag" style="background-color: ${tagInfo.color}20; color: ${tagInfo.color};">${tagInfo.label}</span>`;
              }
              return `<span class="tag" style="background-color: #e5e7eb; color: #374151;">${tagValue}</span>`;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <div class="section">
        <div class="section-title">📅 Metadata</div>
        <div class="field-grid">
          <div class="field">
            <div class="field-label">Creato il</div>
            <div class="field-value">${new Date(selectedContact.created_at).toLocaleDateString('it-IT', { 
              day: '2-digit', 
              month: 'long', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</div>
          </div>
          ${selectedContact.updated_at ? `
            <div class="field">
              <div class="field-label">Modificato il</div>
              <div class="field-value">${new Date(selectedContact.updated_at).toLocaleDateString('it-IT', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</div>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="footer">
        <p>MailMassProm - Stampato il ${new Date().toLocaleDateString('it-IT', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(printContent);
  printWindow.document.close();
  
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
};
// Aggiungi il modale alla fine del componente TagsManagementModal
<CancelConfirmModal
  show={showCancelEditConfirm}
  onCancel={() => setShowCancelEditConfirm(false)}
  onConfirm={() => {
    setShowCancelEditConfirm(false);
    setEditingTag(null);
  }}
  title="Annulla Modifica Tag"
  message="Sei sicuro di voler annullare le modifiche a questo tag?"
/>
  if (!show) return null;

  return (
    <>
      {/* MODALE PRINCIPALE GESTIONE TAG */}
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
          
          {/* HEADER */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600 p-2 rounded-lg">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gestione Tag</h2>
                <p className="text-sm text-gray-600">Organizza e personalizza i tuoi tag</p>
              </div>
            </div>
            <button 
  onClick={(e) => {
    e.stopPropagation();  // 🔥 AGGIUNGI QUESTO
    onClose();
  }} 
  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition"
>
  <X className="w-6 h-6" />
</button>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* SEZIONE AGGIUNGI NUOVO TAG */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" />
                Crea Nuovo Tag
              </h3>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nome del tag (es. Cliente VIP)"
                  value={newTagLabel}
                  onChange={(e) => setNewTagLabel(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Colore
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition ${
                          newTagColor === c ? "border-purple-600 scale-110 ring-2 ring-purple-200" : "border-gray-300"
                        }`}
                        style={{ backgroundColor: c }}
                        onClick={() => setNewTagColor(c)}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleAddTag}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center justify-center gap-2 transition font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Aggiungi Tag
                </button>
              </div>
            </div>

            {/* BARRA RICERCA */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cerca tag..."
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>

            {/* LISTA TAG */}
            {loading ? (
              <div className="text-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
                <p className="text-gray-600">Caricamento tag...</p>
              </div>
            ) : filteredTags.length === 0 ? (
              <div className="text-center py-10">
                <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nessun tag trovato</p>
                <p className="text-sm text-gray-400">Crea il tuo primo tag per iniziare</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTags.map(tag => {
                  const contacts = tagContacts[tag.id] || [];
                  const isExpanded = expandedTag === tag.id;

                  return (
                    <div
                      key={tag.id}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all"
                    >
                      {editingTag?.id === tag.id ? (
                        // MODALITÀ MODIFICA
                        <div className="p-4 space-y-3">
                          <input
                            type="text"
                            value={editingTag.label}
                            onChange={(e) => setEditingTag({ ...editingTag, label: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                          />
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Colore
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {colorOptions.map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  className={`w-8 h-8 rounded-full border-2 transition ${
                                    editingTag.color === c ? "border-purple-600 scale-110 ring-2 ring-purple-200" : "border-gray-300"
                                  }`}
                                  style={{ backgroundColor: c }}
                                  onClick={() => setEditingTag({ ...editingTag, color: c })}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={handleUpdateTag}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-1 transition"
                            >
                              <Check className="w-4 h-4" />
                              Salva
                            </button>
                            <button
  onClick={() => setShowCancelEditConfirm(true)}
  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center justify-center gap-1 transition"
>
  <X className="w-4 h-4" />
  Annulla
</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* MODALITÀ VISUALIZZAZIONE */}
                          <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: tag.color + '20' }}
                              >
                                <Tag className="w-5 h-5" style={{ color: tag.color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                                    style={{ 
                                      backgroundColor: tag.color + '20',
                                      color: tag.color
                                    }}
                                  >
                                    {tag.label}
                                  </span>
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                    <Users className="w-3 h-3" />
                                    {contacts.length} {contacts.length === 1 ? 'contatto' : 'contatti'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Creato il {new Date(tag.created_at).toLocaleDateString('it-IT')}
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-2 items-center flex-shrink-0">
                              {contacts.length > 0 && (
                                <button
                                  onClick={() => toggleExpand(tag.id)}
                                  className="text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition"
                                  title={isExpanded ? "Nascondi contatti" : "Mostra contatti"}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                              
                              <button
                                onClick={() => setEditingTag(tag)}
                                className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"
                                title="Modifica"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(tag)}
                                className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                                title="Elimina"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* LISTA CONTATTI ESPANSA */}
                          {isExpanded && contacts.length > 0 && (
                            <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
                                  Contatti con questo tag:
                                </p>
                                {contacts.map(contact => (
                                  <button
                                    key={contact.id}
                                    onClick={() => openContactDetail(contact)}
                                    className="w-full flex items-center gap-3 bg-white px-3 py-2 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-transparent transition cursor-pointer"
                                  >
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                      <Users className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {contact.name}
                                      </p>
                                      <p className="text-xs text-gray-500 truncate">
                                        {contact.email}
                                      </p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredTags.length} tag {filteredTags.length === 1 ? 'trovato' : 'trovati'}
            </p>

            <div className="flex gap-3">
              {/* 🔥 BOTTONE STAMPA */}
              <button
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Stampa Lista
              </button>

              <button
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition font-medium"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODALE CONFERMA ELIMINAZIONE */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Elimina Tag</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Sei sicuro di voler eliminare il tag <strong>{showDeleteConfirm.label}</strong>?
              <br />
              <span className="text-sm text-red-600 mt-2 block">
                ⚠️ Questa azione non può essere annullata.
              </span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition font-medium"
              >
                Annulla
              </button>
              <button
                onClick={() => handleDeleteTag(showDeleteConfirm.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition font-medium"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
     
{/* MODALE DETTAGLIO CONTATTO */}
{selectedContact && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
      
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Dettaglio Contatto</h3>
            <p className="text-sm text-gray-600">Informazioni complete</p>
          </div>
        </div>
        <button
          onClick={closeContactDetail}
          className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        
        {/* Informazioni Base */}
        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Informazioni Contatto
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Nome</label>
              <p className="text-base font-medium text-gray-900 mt-1">{selectedContact.name || '-'}</p>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Email</label>
              <p className="text-base text-gray-900 mt-1 break-all">{selectedContact.email || '-'}</p>
            </div>
            
            {selectedContact.ruolo && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Ruolo</label>
                <p className="text-base text-gray-900 mt-1">{selectedContact.ruolo}</p>
              </div>
            )}
            
            {selectedContact.settore && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Settore</label>
                <p className="text-base text-gray-900 mt-1">{selectedContact.settore}</p>
              </div>
            )}
            
            {selectedContact.canale && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Canale</label>
                <p className="text-base text-gray-900 mt-1">{selectedContact.canale}</p>
              </div>
            )}
            
            {selectedContact.status && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  selectedContact.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {selectedContact.status}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dettagli Canale */}
        {(selectedContact.tipologia_canale || selectedContact.periodicita_canale || selectedContact.copertura_canale) && (
          <div className="bg-blue-50 rounded-xl p-6 space-y-3">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-600" />
              Dettagli Canale
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedContact.tipologia_canale && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Tipologia</label>
                  <p className="text-base text-gray-900 mt-1">{selectedContact.tipologia_canale}</p>
                </div>
              )}
              
              {selectedContact.periodicita_canale && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Periodicità</label>
                  <p className="text-base text-gray-900 mt-1">{selectedContact.periodicita_canale}</p>
                </div>
              )}
              
              {selectedContact.copertura_canale && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Copertura</label>
                  <p className="text-base text-gray-900 mt-1">{selectedContact.copertura_canale}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tag */}
        {selectedContact.tags && selectedContact.tags.length > 0 && (
          <div className="bg-purple-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <Tag className="w-5 h-5 text-purple-600" />
              Tag Associati
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedContact.tags.map((tagValue, index) => {
                const tagInfo = tags.find(t => t.value === tagValue);
                return tagInfo ? (
                  <span
                    key={index}
                    className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: tagInfo.color + '20',
                      color: tagInfo.color
                    }}
                  >
                    {tagInfo.label}
                  </span>
                ) : (
                  <span key={index} className="inline-block px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-700">
                    {tagValue}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="border-t border-gray-200 pt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-500">
          <div>
            <span className="font-medium">Creato il:</span> {new Date(selectedContact.created_at).toLocaleDateString('it-IT', { 
              day: '2-digit', 
              month: 'long', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          {selectedContact.updated_at && (
            <div>
              <span className="font-medium">Modificato il:</span> {new Date(selectedContact.updated_at).toLocaleDateString('it-IT', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer - CON BOTTONE STAMPA */}
      <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          ID: {selectedContact.id}
        </div>
        
        <div className="flex gap-3">
          {/* 🔥 BOTTONE STAMPA */}
          <button
            onClick={handlePrintContact}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Stampa
          </button>
          
          <button
            onClick={closeContactDetail}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition font-medium"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </>
    
  );
};

// 🏢 MODALE GESTIONE SETTORI
const SectorsManagementModal = ({ show, onClose }) => {
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSector, setEditingSector] = useState(null);
  const [newSectorName, setNewSectorName] = useState('');
  const [searchSector, setSearchSector] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const fetchSectors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sectors')
        .select('*')
        .order('name');

      if (error) throw error;
      setSectors(data || []);
    } catch (error) {
      console.error('❌ Errore caricamento settori:', error);
      toast.error('Errore nel caricamento dei settori');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) fetchSectors();
  }, [show]);

  const handleAddSector = async () => {
    if (!newSectorName.trim()) {
      toast.error('⚠️ Inserisci un nome per il settore');
      return;
    }
  
    try {
      const { error } = await supabase
        .from('sectors')
        .insert({
          id: crypto.randomUUID(),
          name: newSectorName.trim()
        });
  
      if (error) throw error;
      toast.success('✅ Settore creato!');
      setNewSectorName('');
      await fetchSectors();
    } catch (error) {
      console.error('❌ Errore creazione settore:', error);
      toast.error('Errore nella creazione del settore');
    }
  };

  const handleUpdateSector = async () => {
    if (!editingSector) return;
  
    try {
      const { error } = await supabase
        .from('sectors')
        .update({
          name: editingSector.name
        })
        .eq('id', editingSector.id);
  
      if (error) throw error;
      toast.success('✅ Settore aggiornato!');
      setEditingSector(null);
      await fetchSectors();
    } catch (error) {
      console.error('❌ Errore aggiornamento:', error);
      toast.error('Errore aggiornamento');
    }
  };


  const handleDeleteSector = async (sectorId) => {
    try {
      const { error } = await supabase
        .from('sectors')
        .delete()
        .eq('id', sectorId);

      if (error) throw error;
      toast.success('✅ Settore eliminato!');
      setShowDeleteConfirm(null);
      await fetchSectors();
    } catch (error) {
      console.error('❌ Errore eliminazione settore:', error);
      toast.error('Errore eliminazione');
    }
  };

  const filteredSectors = sectors.filter(s =>
    s.name.toLowerCase().includes(searchSector.toLowerCase())
  );

  if (!show) return null;

  return (
    <>
      <div 
  className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
  onClick={onClose}  // 🔥 Chiudi se clicchi sul backdrop
>
  <div 
    className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
    onClick={(e) => e.stopPropagation()}  // 🔥 AGGIUNGI QUESTO - ferma propagazione
  >
    
    {/* Header */}
    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Briefcase className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestione Settori</h2>
          <p className="text-sm text-gray-600">Organizza i settori dei tuoi contatti</p>
        </div>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition">
        <X className="w-6 h-6" />
      </button>
    </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Form Aggiungi */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Crea Nuovo Settore
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Nome del settore"
                  value={newSectorName}
                  onChange={(e) => setNewSectorName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSector()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  onClick={handleAddSector}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Aggiungi
                </button>
              </div>
            </div>

            {/* Ricerca */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cerca settore..."
                value={searchSector}
                onChange={(e) => setSearchSector(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>

            {/* Lista Settori */}
            {loading ? (
              <div className="text-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
                <p className="text-gray-600">Caricamento...</p>
              </div>
            ) : filteredSectors.length === 0 ? (
              <div className="text-center py-10">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nessun settore trovato</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSectors.map(sector => (
                  <div key={sector.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    {editingSector?.id === sector.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editingSector.name}
                          onChange={(e) => setEditingSector({ ...editingSector, name: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <button onClick={handleUpdateSector} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingSector(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{sector.name}</p>
                            <p className="text-xs text-gray-500">ID: {sector.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingSector(sector)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setShowDeleteConfirm(sector)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <p className="text-sm text-gray-600">{filteredSectors.length} settori</p>
            <button 
    onClick={(e) => {
      e.stopPropagation();  // 🔥 AGGIUNGI QUESTO
      onClose();
    }} 
    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition font-medium"
  >
    Chiudi
  </button>
          </div>
        </div>
      </div>

      {/* Modale Conferma Eliminazione */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Elimina Settore</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Sei sicuro di voler eliminare <strong>{showDeleteConfirm.name}</strong>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition font-medium">
                Annulla
              </button>
              <button onClick={() => handleDeleteSector(showDeleteConfirm.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition font-medium">
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// 📡 MODALE GESTIONE CANALI
const ChannelsManagementModal = ({ show, onClose }) => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingChannel, setEditingChannel] = useState(null);
  const [newChannelName, setNewChannelName] = useState('');
  const [searchChannel, setSearchChannel] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('name');

      if (error) throw error;
      setChannels(data || []);
    } catch (error) {
      console.error('❌ Errore caricamento canali:', error);
      toast.error('Errore nel caricamento dei canali');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) fetchChannels();
  }, [show]);

  const handleAddChannel = async () => {
  if (!newChannelName.trim()) {
    toast.error('⚠️ Inserisci un nome per il canale');
    return;
  }

  try {
    const { error } = await supabase
      .from('channels')
      .insert({
        id: crypto.randomUUID(),
        name: newChannelName.trim()
      });

    if (error) throw error;
    toast.success('✅ Canale creato!');
    setNewChannelName('');
    await fetchChannels();
  } catch (error) {
    console.error('❌ Errore creazione canale:', error);
    toast.error('Errore nella creazione');
  }
};

const handleUpdateChannel = async () => {
  if (!editingChannel) return;

  try {
    const { error } = await supabase
      .from('channels')
      .update({
        name: editingChannel.name
      })
      .eq('id', editingChannel.id);

    if (error) throw error;
    toast.success('✅ Canale aggiornato!');
    setEditingChannel(null);
    await fetchChannels();
  } catch (error) {
    console.error('❌ Errore aggiornamento:', error);
    toast.error('Errore aggiornamento');
  }
};

  const handleDeleteChannel = async (channelId) => {
    try {
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', channelId);

      if (error) throw error;
      toast.success('✅ Canale eliminato!');
      setShowDeleteConfirm(null);
      await fetchChannels();
    } catch (error) {
      console.error('❌ Errore eliminazione:', error);
      toast.error('Errore eliminazione');
    }
  };

  const filteredChannels = channels.filter(c =>
    c.name.toLowerCase().includes(searchChannel.toLowerCase())
  );

  if (!show) return null;

  return (
    <>
<div 
  className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
  onClick={onClose}  // 🔥 Chiudi se clicchi sul backdrop
>
  <div 
    className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
    onClick={(e) => e.stopPropagation()}  // 🔥 AGGIUNGI QUESTO - ferma propagazione
  >
    
    {/* Header */}
    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Briefcase className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestione Canali</h2>
          <p className="text-sm text-gray-600">Organizza i canali delle tue comunicazioni</p>
        </div>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition">
        <X className="w-6 h-6" />
      </button>
    </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            <div className="bg-gradient-to-br from-teal-50 to-blue-50 border-2 border-teal-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-600" />
                Crea Nuovo Canale
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Nome del canale"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddChannel()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <button
                  onClick={handleAddChannel}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Aggiungi
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Cerca canale..."
                value={searchChannel}
                onChange={(e) => setSearchChannel(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>

            {loading ? (
              <div className="text-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
                <p className="text-gray-600">Caricamento...</p>
              </div>
            ) : filteredChannels.length === 0 ? (
              <div className="text-center py-10">
                <Radio className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nessun canale trovato</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredChannels.map(channel => (
                  <div key={channel.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    {editingChannel?.id === channel.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editingChannel.name}
                          onChange={(e) => setEditingChannel({ ...editingChannel, name: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                        <button onClick={handleUpdateChannel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingChannel(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                            <Radio className="w-5 h-5 text-teal-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{channel.name}</p>
                            
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingChannel(channel)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setShowDeleteConfirm(channel)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <p className="text-sm text-gray-600">{filteredChannels.length} canali</p>
            <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition font-medium">
              Chiudi
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Elimina Canale</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Sei sicuro di voler eliminare <strong>{showDeleteConfirm.name}</strong>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition font-medium">
                Annulla
              </button>
              <button onClick={() => handleDeleteChannel(showDeleteConfirm.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition font-medium">
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// 👤 MODALE GESTIONE RUOLI
const RolesManagementModal = ({ show, onClose }) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [searchRole, setSearchRole] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_roles')
        .select('*')
        .order('name');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('❌ Errore caricamento ruoli:', error);
      toast.error('Errore nel caricamento dei ruoli');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) fetchRoles();
  }, [show]);

  const handleAddRole = async () => {
    if (!newRoleName.trim()) {
      toast.error('⚠️ Inserisci un nome per il ruolo');
      return;
    }
  
    try {
      const { error } = await supabase
        .from('contact_roles')
        .insert({
          id: crypto.randomUUID(),
          name: newRoleName.trim()
        });
  
      if (error) throw error;
      toast.success('✅ Ruolo creato!');
      setNewRoleName('');
      await fetchRoles();
    } catch (error) {
      console.error('❌ Errore creazione ruolo:', error);
      toast.error('Errore nella creazione');
    }
  };
  
  const handleUpdateRole = async () => {
    if (!editingRole) return;
  
    try {
      const { error } = await supabase
        .from('contact_roles')
        .update({
          name: editingRole.name
        })
        .eq('id', editingRole.id);
  
      if (error) throw error;
      toast.success('✅ Ruolo aggiornato!');
      setEditingRole(null);
      await fetchRoles();
    } catch (error) {
      console.error('❌ Errore aggiornamento:', error);
      toast.error('Errore aggiornamento');
    }
  };

  const handleDeleteRole = async (roleId) => {
    try {
      const { error } = await supabase
        .from('contact_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
      toast.success('✅ Ruolo eliminato!');
      setShowDeleteConfirm(null);
      await fetchRoles();
    } catch (error) {
      console.error('❌ Errore eliminazione:', error);
      toast.error('Errore eliminazione');
    }
  };

  const filteredRoles = roles.filter(r =>
    r.name.toLowerCase().includes(searchRole.toLowerCase())
  );

  if (!show) return null;

  return (
    <>
<div 
  className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
  onClick={onClose}  // 🔥 Chiudi se clicchi sul backdrop
>
  <div 
    className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
    onClick={(e) => e.stopPropagation()}  // 🔥 AGGIUNGI QUESTO - ferma propagazione
  >
    
    {/* Header */}
    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Briefcase className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestione Ruoli</h2>
          <p className="text-sm text-gray-600">Organizza i ruoli dei tuoi contatti</p>
        </div>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition">
        <X className="w-6 h-6" />
      </button>
    </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-orange-600" />
                Crea Nuovo Ruolo
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Nome del ruolo"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddRole()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                />
                <button
                  onClick={handleAddRole}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Aggiungi
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Cerca ruolo..."
                value={searchRole}
                onChange={(e) => setSearchRole(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>

            {loading ? (
              <div className="text-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-2" />
                <p className="text-gray-600">Caricamento...</p>
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="text-center py-10">
                <UserCog className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nessun ruolo trovato</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRoles.map(role => (
                  <div key={role.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    {editingRole?.id === role.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editingRole.name}
                          onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                        <button onClick={handleUpdateRole} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingRole(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <UserCog className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{role.name}</p>
                           
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingRole(role)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setShowDeleteConfirm(role)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <p className="text-sm text-gray-600">{filteredRoles.length} ruoli</p>
            <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition font-medium">
              Chiudi
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Elimina Ruolo</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Sei sicuro di voler eliminare <strong>{showDeleteConfirm.name}</strong>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition font-medium">
                Annulla
              </button>
              <button onClick={() => handleDeleteRole(showDeleteConfirm.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition font-medium">
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
// Componente CancelConfirmModal - mettilo alla fine del file, prima dell'export
const CancelConfirmModal = ({ show, onCancel, onConfirm, title, message }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
      <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-orange-100 p-3 rounded-full">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {title || 'Conferma Annullamento'}
          </h3>
        </div>
        <p className="text-gray-600 mb-6">
          {message || 'Sei sicuro di voler annullare? Tutte le modifiche non salvate andranno perse.'}
        </p>
        <div className="flex gap-3">
          <button 
            onClick={onCancel} 
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition font-medium"
          >
            Continua Modifica
          </button>
          <button 
            onClick={onConfirm} 
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition font-medium"
          >
            Sì, Annulla
          </button>
        </div>
      </div>
    </div>
  );
};
// 🔥 Alla fine del file EmailPlatform.jsx, DOPO tutti i componenti
export default EmailPlatform;