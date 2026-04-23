import { createContext, useContext, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const EditorContext = createContext();

export const EditorProvider = ({ children }) => {
  const [showSectionEditor, setShowSectionEditor] = useState(false);
  const [editingSectionData, setEditingSectionData] = useState(null);
  const [columnStyles, setColumnStyles] = useState({});
  const [isRestoring, setIsRestoring] = useState(false);
  
  const hasRestoredRef = useRef(false);
  const isPageLoadRef = useRef(true);

  // 💾 Salva in sessionStorage
  useEffect(() => {
    if (isRestoring) return;
    if (showSectionEditor && editingSectionData) {
      const stateToSave = {
        showSectionEditor: true,
        editingSectionData,
        columnStyles,
        timestamp: Date.now()
      };
      sessionStorage.setItem('emailEditorState', JSON.stringify(stateToSave));
    }
  }, [showSectionEditor, editingSectionData, columnStyles, isRestoring]);

  // 🔄 Ripristina da sessionStorage — SOLO al mount
  useEffect(() => {
    const restoreState = () => {
      if (hasRestoredRef.current) return;
      if (showSectionEditor) return;

      const savedState = sessionStorage.getItem('emailEditorState');
      if (!savedState) return;

      try {
        const parsed = JSON.parse(savedState);
        const oneHour = 60 * 60 * 1000;

        if (Date.now() - parsed.timestamp < oneHour) {
          setIsRestoring(true);

          setTimeout(() => {
            setShowSectionEditor(true);
            setEditingSectionData(parsed.editingSectionData);
            setColumnStyles(parsed.columnStyles || {});
            hasRestoredRef.current = true;

            // ✅ Sblocca solo isRestoring, NON chiudere nulla
            setTimeout(() => {
              setIsRestoring(false);
            }, 500);

            if (!isPageLoadRef.current) {
              toast.success('📝 Editor ripristinato', { duration: 2000 });
            }
          }, 300);

        } else {
          sessionStorage.removeItem('emailEditorState');
        }
      } catch (e) {
        console.error('❌ Error restoring state:', e);
        sessionStorage.removeItem('emailEditorState');
      }
    };

    restoreState();

    setTimeout(() => {
      isPageLoadRef.current = false;
    }, 1500);

    // ✅ NESSUN handleFocus / handleVisibilityChange
    // erano la causa del reset di campaignMode ad ogni click su contentEditable

  }, []); // ✅ solo al mount

  const closeEditor = () => {
    setShowSectionEditor(false);
    setEditingSectionData(null);
    setColumnStyles({});
    setIsRestoring(false);
    sessionStorage.removeItem('emailEditorState');
  };

  return (
    <EditorContext.Provider value={{
      showSectionEditor,
      setShowSectionEditor,
      editingSectionData,
      setEditingSectionData,
      columnStyles,
      setColumnStyles,
      isRestoring,
      closeEditor
    }}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditorState = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditorState must be used within EditorProvider');
  }
  return context;
};