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
    console.log('💾 EditorContext Save:', { showSectionEditor, hasData: !!editingSectionData, isRestoring });
    
    if (isRestoring) {
      console.log('⏸️ Skipping save during restore');
      return;
    }
    
    if (showSectionEditor && editingSectionData) {
      const stateToSave = {
        showSectionEditor: true,
        editingSectionData,
        columnStyles,
        timestamp: Date.now()
      };
      sessionStorage.setItem('emailEditorState', JSON.stringify(stateToSave));
      console.log('✅ EditorContext: State saved to sessionStorage');
    }
  }, [showSectionEditor, editingSectionData, columnStyles, isRestoring]);

// 🔄 Ripristina da sessionStorage
useEffect(() => {
    console.log('🔄 EditorContext: Initializing...');
    
    const restoreState = () => {
      // ⚠️ Non ripristinare se è già stato fatto
      if (hasRestoredRef.current) {
        console.log('⏸️ Already restored in this session');
        return;
      }
      
      // ⚠️ Non ripristinare se l'editor è già aperto
      if (showSectionEditor) {
        console.log('⏸️ Editor already open');
        return;
      }
      
      console.log('🔍 Checking for saved state...');
      const savedState = sessionStorage.getItem('emailEditorState');
      
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          console.log('📦 Found saved state:', parsed);
          
          const oneHour = 60 * 60 * 1000;
          if (Date.now() - parsed.timestamp < oneHour) {
            console.log('✅ Restoring editor state...');
            
            setIsRestoring(true);
            
            setTimeout(() => {
              setShowSectionEditor(true);
              setEditingSectionData(parsed.editingSectionData);
              setColumnStyles(parsed.columnStyles || {});
              hasRestoredRef.current = true;
              
              setTimeout(() => {
                setIsRestoring(false);
                console.log('🔓 Restore complete');
              }, 2000);
              
              if (!isPageLoadRef.current) {
                toast.success('📝 Editor ripristinato', { duration: 2000 });
              }
            }, 300);
            
          } else {
            console.log('⏰ Saved state expired');
            sessionStorage.removeItem('emailEditorState');
          }
        } catch (e) {
          console.error('❌ Error restoring state:', e);
          sessionStorage.removeItem('emailEditorState');
        }
      } else {
        console.log('❌ No saved state found');
      }
    };
  
    // Ripristina al mount
    restoreState();
    
    // Segna che non è più il primo caricamento
    setTimeout(() => {
      isPageLoadRef.current = false;
    }, 1500);
    
    // ✅ AGGIUNGI GLI EVENT LISTENER
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Tab became visible');
        // Reset del flag per permettere il restore
        if (!showSectionEditor) {
          console.log('🔄 Editor closed, attempting restore...');
          hasRestoredRef.current = false;
          restoreState();
        }
      }
    };
  
    const handleFocus = () => {
      console.log('👁️ Window focused');
      if (!showSectionEditor) {
        console.log('🔄 Editor closed, attempting restore...');
        hasRestoredRef.current = false;
        restoreState();
      }
    };
  
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
  
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [showSectionEditor]); // ⚠️ IMPORTANTE: aggiungi showSectionEditor come dipendenza

  const closeEditor = () => {
    setShowSectionEditor(false);
    setEditingSectionData(null);
    setColumnStyles({});
    setIsRestoring(false);
    sessionStorage.removeItem('emailEditorState');
    console.log('🗑️ Editor closed and state cleared');
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