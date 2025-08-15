import type { ProtonDispatch } from '@proton/redux-shared-store-types';
import type { CalendarEventV6Response } from '@proton/shared/lib/api/events';
import type { Api } from '@proton/shared/lib/interfaces';

import type { CalendarsState } from '../calendars';

export type CalendarEventLoopV6RequiredState = CalendarsState;

export type CalendarEventLoopV6Callback = ({
    event,
    state,
}: {
    event: CalendarEventV6Response;
    state: CalendarEventLoopV6RequiredState;
    dispatch: ProtonDispatch<any>;
    api: Api;
}) => Promise<any> | undefined;
