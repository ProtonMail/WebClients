import { createAction } from '@reduxjs/toolkit';

import { Address, User, UserSettings } from '@proton/shared/lib/interfaces';

export const initEvent = createAction(
    'init event',
    (payload: { User: User; Addresses?: Address[]; UserSettings?: UserSettings }) => ({ payload })
);
