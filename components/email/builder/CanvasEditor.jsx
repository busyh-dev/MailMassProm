import React from "react";
import { useDrop } from "react-dnd";
import BlockRenderer from "./BlockRenderer";

export default function CanvasEditor({ blocks, onUpdateBlock }) {
  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: "BLOCK",
    drop: (item) => onUpdateBlock(blocks.length, { type: item.type, content: "" }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  return (
    <div
      ref={drop}
      className="flex-1 bg-gray-50 p-6 overflow-y-auto"
    >
      <div className="max-w-[700px] mx-auto space-y-6">
        {blocks.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            ⬅️ Trascina un blocco dalla sidebar
          </div>
        )}

        {blocks.map((block, index) => (
          <BlockRenderer
            key={index}
            index={index}
            block={block}
            onUpdateBlock={onUpdateBlock}
          />
        ))}
      </div>
    </div>
  );
}
