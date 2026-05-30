import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('Main.tsx is executing, mounting React root...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Failed to find root element!');
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
