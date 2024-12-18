import type { TypedUseSelectorHook } from 'react-redux'

import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store'

import type { DocsDispatch } from './store'
import type { DocsState } from './rootReducer'

export const useDocsDispatch: () => DocsDispatch = baseUseDispatch
export const useDocsSelector: TypedUseSelectorHook<DocsState> = baseUseSelector
