// components/App.jsx
import Editor from "./Editor";
import Block from "./Block";

const App = () => {
  return (
    <div style={{ display: "flex" }}>
      <div style={{ width: "200px" }}>
        <h3>Blocks</h3>
        <Block type="image" label="Image Block" />
        <Block type="text" label="Text Block" />
        <Block type="button" label="Button Block" />
      </div>
      <div style={{ marginLeft: "20px", flex: 1 }}>
        <Editor />
      </div>
    </div>
  );
};

export default App;
