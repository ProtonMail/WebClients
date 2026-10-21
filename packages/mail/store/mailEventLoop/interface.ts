import type { ProtonDispatch } from '@proton/redux-shared-store-types/interface';
import type { MailEventV6Response } from '@proton/shared/lib/api/events';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import type { MailFiltersState } from '../filters';
import type { IncomingAddressForwardingState, OutgoingAddressForwardingState } from '../forwarding';
import type { CategoriesState } from '../labels';
import type { MailSettingState } from '../mailSettings';

export type MailEventLoopV6RequiredState = MailSettingState &
    CategoriesState &
    MailFiltersState &
    IncomingAddressForwardingState &
    OutgoingAddressForwardingState;

export type MailEventLoopV6Callback = ({
    event,
    state,
}: {
    event: MailEventV6Response;
    state: MailEventLoopV6RequiredState;
    dispatch: ProtonDispatch<any>;
    api: Api;
}) => Promise<any> | undefined;
