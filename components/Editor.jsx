// components/Editor.jsx
import { useDrop } from "react-dnd";
import { useState } from "react";
import Block from "./Block";

const Editor = () => {
  const [blocks, setBlocks] = useState([]);

  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: "BLOCK",
    drop: (item) => addBlock(item.type),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const addBlock = (type) => {
    setBlocks((prev) => [...prev, { type, id: Date.now() }]);
  };

  return (
    <div
      ref={drop}
      className={`editor ${isOver ? "bg-gray-200" : ""}`}
      style={{ minHeight: "500px", border: "2px dashed #ccc", padding: "20px" }}
    >
      <h2>Editor</h2>
      <div>
        {blocks.map((block, index) => (
          <div key={block.id} style={{ marginBottom: "10px" }}>
            {block.type === "image" ? (
              <img src="https://via.placeholder.com/300" alt="Placeholder" />
            ) : (
              <p>{block.type} Block {index + 1}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Editor;
