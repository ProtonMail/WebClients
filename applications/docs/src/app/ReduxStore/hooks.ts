import { TypedUseSelectorHook } from 'react-redux'

import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store'

import { DocsDispatch, DocsState } from './store'

export const useDocsDispatch: () => DocsDispatch = baseUseDispatch
export const useDocsSelector: TypedUseSelectorHook<DocsState> = baseUseSelector
