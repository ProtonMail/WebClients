import { createAction } from '@reduxjs/toolkit';

import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { User } from '@proton/shared/lib/interfaces/User';
import type { UserSettings } from '@proton/shared/lib/interfaces/UserSettings';

export const initEvent = createAction(
    'init event',
    (payload: { User: User; Addresses?: Address[]; UserSettings?: UserSettings }) => ({ payload })
);
