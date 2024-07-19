import type { TypedUseSelectorHook } from 'react-redux';

import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store';

import type { DriveDispatch, DriveState } from './store';

export const useDriveDispatch: () => DriveDispatch = baseUseDispatch;
export const useDriveSelector: TypedUseSelectorHook<DriveState> = baseUseSelector;
