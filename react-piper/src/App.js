import './App.scss';
import "react-toastify/dist/ReactToastify.css";
import Editor from './components/Editor';
import {ToastContainer} from 'react-toastify';
import {specs_url} from "./config";

function App() {
  return (
    <div className="App">
      <ToastContainer/>
      <Editor specs_url={specs_url} />
    </div>
  );
}

export default App;
