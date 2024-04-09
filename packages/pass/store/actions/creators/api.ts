import { createAction } from '@reduxjs/toolkit';

import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withRequestSuccess } from '@proton/pass/store/actions/enhancers/request';
import { withSettings } from '@proton/pass/store/actions/enhancers/settings';
import type { ShareEventResponse } from '@proton/pass/store/sagas/events/channel.share';
import type { UserEvent } from '@proton/pass/types/api';
import { pipe } from '@proton/pass/utils/fp/pipe';
import identity from '@proton/utils/identity';

type ShareEvent = ShareEventResponse & { shareId: string };

export const shareEvent = createAction('api::event::share', (payload: ShareEvent) => withCache({ payload }));
export const userEvent = createAction('api::event::user', (payload: UserEvent) =>
    pipe(withCache, payload.UserSettings ? withSettings : identity)({ payload })
);

export const channelAcknowledge = createAction(
    'api::channel::ack',
    withRequestSuccess(() => ({ payload: {} }), { maxAge: -1 })
);
