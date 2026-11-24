import { createRoot } from 'react-dom/client'
import '@proton/polyfill'

import UserApp from './routes/(user)/page'
import PublicApp from './routes/(public)/page'
import PublicAppV2 from './routes/(user)/(document)/doc2/publicApp'
import { isDoc2Path } from './routes/(user)/(document)/doc2/__utils/isDoc2Path'

// Import this before ./style so that style takes precedence
import './tailwind.scss'
import './app.scss'

const { searchParams, pathname } = new URL(window.location.href)
const mode = searchParams.get('mode') || ''
const isPublicApp = ['open-url', 'open-url-download'].includes(mode)
// doc2 takes a public link on its own path, and hands over to the public app while it is off
const isDoc2PublicApp = mode === 'open-url' && isDoc2Path(pathname)

const container = document.querySelector('.app-root')!
const root = createRoot(container)

function renderApp() {
  if (isDoc2PublicApp) {
    return <PublicAppV2 />
  }
  return isPublicApp ? <PublicApp /> : <UserApp />
}

// eslint-disable-next-line no-console
console.log(`Rendering ${isPublicApp ? 'public' : 'user'} app`)
root.render(renderApp())
