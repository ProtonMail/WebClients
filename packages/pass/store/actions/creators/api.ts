import { createAction } from '@reduxjs/toolkit';

import type { UserEvent } from '@proton/pass/types/api';

import type { ShareEventResponse } from '../../sagas/events/channel.share';

export const shareEvent = createAction<ShareEventResponse & { shareId: string }>('share event');
export const userEvent = createAction<UserEvent>('user event');
