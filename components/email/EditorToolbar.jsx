import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Pilcrow,
} from "lucide-react";

export const ToolbarPlugin = () => {
  const [editor] = useLexicalComposerContext();

  const applyFormat = useCallback((format) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  }, [editor]);

  const applyBlockFormat = useCallback((format) => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, format);
  }, [editor]);

  return (
    <div className="flex flex-wrap gap-2 p-2 border-b bg-gray-50 rounded-t-lg">
      <button
        type="button"
        onClick={() => applyFormat("bold")}
        className="p-2 rounded hover:bg-gray-200"
        title="Grassetto"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => applyFormat("italic")}
        className="p-2 rounded hover:bg-gray-200"
        title="Corsivo"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => applyFormat("underline")}
        className="p-2 rounded hover:bg-gray-200"
        title="Sottolineato"
      >
        <Underline className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => applyBlockFormat("paragraph")}
        className="p-2 rounded hover:bg-gray-200"
        title="Paragrafo"
      >
        <Pilcrow className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => applyBlockFormat("ul")}
        className="p-2 rounded hover:bg-gray-200"
        title="Lista non ordinata"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => applyBlockFormat("ol")}
        className="p-2 rounded hover:bg-gray-200"
        title="Lista ordinata"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
    </div>
  );
};