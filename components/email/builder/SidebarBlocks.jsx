import React from "react";
import { useDrag } from "react-dnd";

const blockTypes = [
  { type: "header", label: "Header", icon: "🟦" },
  { type: "text", label: "Testo", icon: "✏️" },
  { type: "image", label: "Immagine", icon: "🖼️" },
  { type: "divider", label: "Divider", icon: "➖" },
  { type: "footer", label: "Footer", icon: "🔻" },
];
useEffect(() => {
    async function loadBlocks() {
      const { data } = await supabase
        .from("campaign_blocks")
        .select("*")
        .eq("user_id", user?.id);
  
      setSavedBlocks(data);
    }
  
    loadBlocks();
  }, []);
  
export default function SidebarBlocks({ onAddBlock }) {
  return (
    <div className="w-64 bg-white border-r p-4 flex flex-col gap-3">
      <h2 className="text-lg font-semibold mb-2">Blocchi</h2>

      {blockTypes.map((block) => (
        <SidebarBlock key={block.type} block={block} />
      ))}
    </div>
  );
}

function SidebarBlock({ block }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "BLOCK",
    item: block,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`p-3 border rounded-lg cursor-grab hover:bg-gray-100 flex items-center gap-2 
        ${isDragging ? "opacity-50" : "opacity-100"}`}
    >
      <span>{block.icon}</span> {block.label}
    </div>
  );
}
