import { createAction } from '@reduxjs/toolkit';

import identity from '@proton/utils/identity';

import type { CoreEvent } from '../../../types/api';
import { pipe } from '../../../utils/fp/pipe';
import type { HydratedUserState } from '../../reducers';
import { withRequestSuccess } from '../../request/enhancers';
import type { ShareEventResponse } from '../../sagas/events/v1/channel.share';
import { withCache } from '../enhancers/cache';
import { withBackgroundAction } from '../enhancers/client';
import { withSettings } from '../enhancers/settings';

type ShareEvent = ShareEventResponse & { shareId: string };

export const shareEvent = createAction('api::event::share', (payload: ShareEvent) => withCache({ payload }));
export const userRefresh = createAction('api::event::core::refresh', (payload: HydratedUserState) => withCache({ payload }));
export const coreEvent = createAction('api::event::core', (payload: CoreEvent) =>
    pipe(withCache, payload.UserSettings ? withSettings : identity)({ payload })
);

export const channelAcknowledge = createAction(
    'api::channel::ack',
    withRequestSuccess(() => withBackgroundAction({ payload: null }), { maxAge: -1, data: null })
);
