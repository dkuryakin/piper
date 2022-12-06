import './App.scss';
import "react-toastify/dist/ReactToastify.css";
import Editor from './components/Editor';
import {ToastContainer} from 'react-toastify';

function App() {
  return (
    <div className="App">
      <ToastContainer/>
      <Editor/>
    </div>
  );
}

export default App;
