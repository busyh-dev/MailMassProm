// components/Block.jsx
import { useDrag } from "react-dnd";

const Block = ({ type, label }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "BLOCK",
    item: { type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`block ${isDragging ? "opacity-50" : ""}`}
      style={{ padding: "10px", border: "1px solid #ccc", margin: "5px" }}
    >
      {label}
    </div>
  );
};

export default Block;
