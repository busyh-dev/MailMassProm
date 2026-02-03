// =====================================================================
// TIPTAP EDITOR CORRETTO - Con supporto SSR (Next.js)
// =====================================================================

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";
import { useEffect } from "react";

const TiptapEditor = ({ content, onChange, onEditorReady }) => {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: false, // Link escluso perché caricato separatamente
        // 🔥 NON aggiungere underline: false perché non è in StarterKit
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Underline, // ← Caricato una sola volta qui
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content: content || "<p>Inizia a scrivere...</p>",
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[200px] p-4",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (onChange) {
        onChange(html);
      }
    },
  });

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (editor && content && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  if (!editor) {
    return (
      <div className="w-full min-h-[200px] p-4 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Caricamento editor...</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;

// =====================================================================
// 📝 SPIEGAZIONE DELLA CORREZIONE SSR
// =====================================================================

/*
🔥 PROBLEMA:
Next.js usa Server-Side Rendering (SSR), quindi il componente viene 
renderizzato sia lato server che lato client. Tiptap per default 
prova a renderizzare immediatamente, causando "hydration mismatches".

✅ SOLUZIONE:
Aggiungi `immediatelyRender: false` nella configurazione di useEditor.
Questo dice a Tiptap di aspettare il mount lato client prima di renderizzare.

const editor = useEditor({
  immediatelyRender: false, // ✅ Previene errori SSR
  extensions: [...],
  content: content,
  // ... altre opzioni
});

🎯 BENEFICI:
- ✅ Risolve l'errore SSR
- ✅ Nessun hydration mismatch
- ✅ L'editor funziona perfettamente in Next.js
- ✅ Il pulsante mantiene gli stili

📌 NOTA:
Questa è la soluzione ufficiale raccomandata da Tiptap per Next.js
e altri framework SSR come Nuxt, Remix, etc.
*/