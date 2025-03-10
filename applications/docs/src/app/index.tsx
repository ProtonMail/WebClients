import { createRoot } from 'react-dom/client'

import '@proton/polyfill'

import UserApp from './routes/(user)/page'
import PublicApp from './routes/(public)/page'

// Import this before ./style so that style takes precedence
import './tailwind.scss'
import './style'

const isPublicApp = ['open-url', 'open-url-download'].includes(
  new URL(window.location.href).searchParams.get('mode') || '',
)

// eslint-disable-next-line no-console
console.log(`Rendering ${isPublicApp ? 'public' : 'user'} app`)

const container = document.querySelector('.app-root')!
const root = createRoot(container)
root.render(isPublicApp ? <PublicApp /> : <UserApp />)
