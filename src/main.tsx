import { createRoot } from 'react-dom/client'
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/jetbrains-mono'
import '@fontsource-variable/fraunces'
import './styles/global.css'
import App from './app/App'

createRoot(document.getElementById('root')!).render(<App />)
