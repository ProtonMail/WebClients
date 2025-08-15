import type { ProtonDispatch } from '@proton/redux-shared-store-types';
import type { CoreEventV6Response } from '@proton/shared/lib/api/events';
import type { Api } from '@proton/shared/lib/interfaces';

import type { AddressesState } from '../addresses';
import type { DomainsState } from '../domains';
import type { GroupMembersState } from '../groupMembers';
import type { GroupsState } from '../groups';
import type { MembersState } from '../members';
import type { OrganizationState } from '../organization';
import type { PaymentMethodsState } from '../paymentMethods';
import type { SamlState } from '../samlSSO';
import type { SubscriptionState } from '../subscription';
import type { UserState } from '../user';
import type { UserInvitationsState } from '../userInvitations';
import type { UserSettingsState } from '../userSettings';

export type CoreEventLoopV6RequiredState = UserState &
    SubscriptionState &
    OrganizationState &
    AddressesState &
    UserSettingsState &
    MembersState &
    DomainsState &
    PaymentMethodsState &
    UserInvitationsState &
    SamlState &
    GroupsState &
    GroupMembersState;

export type CoreEventLoopV6Callback = ({
    event,
    state,
}: {
    event: CoreEventV6Response;
    state: CoreEventLoopV6RequiredState;
    dispatch: ProtonDispatch<any>;
    api: Api;
}) => Promise<any> | undefined;
