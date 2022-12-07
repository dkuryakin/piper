import './App.scss';
import Editor from "./components/Editor";
import {specs_url} from "./config";

function App() {
  return (
      <div className="App">
          <Editor specs_base_url={specs_url} />
      </div>
  );
}

export default App;
