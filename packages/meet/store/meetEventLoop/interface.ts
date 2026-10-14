import type { ProtonDispatch } from '@proton/redux-shared-store-types';
import type { Api } from '@proton/shared/lib/interfaces';
import type { MeetEventResponse } from '@proton/shared/lib/interfaces/Meet';

import type { MeetingsState } from '../slices/meetings';
import type { UserSettingsState } from '../slices/userSettings';

export type MeetEventLoopRequiredState = MeetingsState & UserSettingsState;

export type MeetEventLoopCallback = ({
    event,
    state,
}: {
    event: MeetEventResponse;
    state: MeetEventLoopRequiredState;
    dispatch: ProtonDispatch<any>;
    api: Api;
}) => Promise<any> | undefined;
