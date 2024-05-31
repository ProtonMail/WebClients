import { TypedUseSelectorHook } from 'react-redux'

import { baseUseDispatch, baseUseSelector } from '@proton/redux-shared-store'

import { DocsDispatch, DocsState } from './store'

export const useDocsDispatch: () => DocsDispatch = baseUseDispatch
export const useDocsSelector: TypedUseSelectorHook<DocsState> = baseUseSelector
