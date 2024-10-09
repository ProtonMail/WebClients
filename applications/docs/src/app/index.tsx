import { createRoot } from 'react-dom/client'

import '@proton/polyfill'

import UserApp from './Apps/User/UserApp'
import PublicApp from './Apps/Public/PublicApp'
import './style'

const isPublicApp = window.location.href.includes('open-url')

// eslint-disable-next-line no-console
console.log(`Rendering ${isPublicApp ? 'public' : 'user'} app`)

const container = document.querySelector('.app-root')
const root = createRoot(container!)
root.render(isPublicApp ? <PublicApp /> : <UserApp />)
