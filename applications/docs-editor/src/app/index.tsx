import ReactDOM from 'react-dom'

import '@proton/polyfill'

import { App } from './App'
import './style'

const searchParams = new URLSearchParams(window.location.search)

const isViewOnly = searchParams.get('viewOnly') === 'true'

ReactDOM.render(<App isViewOnly={isViewOnly} />, document.querySelector('.app-root'))
