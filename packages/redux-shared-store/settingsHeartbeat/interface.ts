import type { CategoriesState, MailSettingState } from 'packages/mail';

import {
    type AddressKeysState,
    type OrganizationKeyState,
    type SecurityCheckupReduxState,
    type SubscriptionState,
    type UserInvitationsState,
    type UserKeysState,
    type UserSettingsState,
} from '@proton/account';

export interface RequiredState
    extends AddressKeysState,
        UserKeysState,
        UserSettingsState,
        OrganizationKeyState,
        UserInvitationsState,
        MailSettingState,
        CategoriesState,
        SubscriptionState,
        SecurityCheckupReduxState {}
