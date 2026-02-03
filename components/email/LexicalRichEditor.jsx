'use client';
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ToolbarPlugin } from "./EditorToolbar";

import "./editor.css"; // stile personalizzato per ContentEditable

const theme = {
  paragraph: 'mb-2',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
  },
};

const editorConfig = {
  namespace: "MyEditor",
  theme,
  onError(error) {
    throw error;
  },
  nodes: [],
};

export const LexicalRichEditor = ({ onChange }) => {
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="border rounded-lg">
        <ToolbarPlugin />

        <div className="px-3 py-2 bg-white rounded-b-lg border-t">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="editor-input min-h-[200px] outline-none" />
            }
            placeholder={<div className="text-gray-400">Scrivi il contenuto dell’email...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <OnChangePlugin onChange={onChange} />
          <AutoFocusPlugin />
        </div>
      </div>
    </LexicalComposer>
  );
};
