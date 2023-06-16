import { createAction } from '@reduxjs/toolkit';

import type { TabId } from '@proton/pass/types';

import type { PopupTabState } from '../../reducers/popup';
import withCacheBlock from '../with-cache-block';

export const popupTabStateSave = createAction(
    'popup tab state save',
    (payload: Partial<PopupTabState> & { tabId: TabId }) => withCacheBlock({ payload })
);

export const popupTabStateGarbageCollect = createAction(
    'popup tab state garbage collect',
    (payload: { tabIds: TabId[] }) => withCacheBlock({ payload })
);
