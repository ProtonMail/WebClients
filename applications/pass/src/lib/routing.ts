import { getLocalIDPath } from '@proton/shared/lib/authentication/pathnameHelper';

import { authStore } from './core';

export const getLocalPath = (path: string) => `/${getLocalIDPath(authStore.getLocalID())}/${path}`;
export const getItemRoute = (shareId: string, itemId: string) => getLocalPath(`share/${shareId}/item/${itemId}`);
