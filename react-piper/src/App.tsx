import './App.css'
import 'react-toastify/dist/ReactToastify.css'
import { Editor } from './components/Editor/ui/Editor'
import { ToastContainer } from 'react-toastify'
import { specs_url } from './config'
import { FC } from 'react'

export const App: FC = () => {
  return (
        <div className='App'>
            <ToastContainer />
            <Editor specsUrl={specs_url} />
        </div>
  )
}
