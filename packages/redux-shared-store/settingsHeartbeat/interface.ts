import type { CategoriesState, MailSettingState } from 'packages/mail';

import type {
    AddressKeysState,
    OrganizationKeyState,
    SecurityCheckupReduxState,
    SubscriptionState,
    UserInvitationsState,
    UserKeysState,
    UserSettingsState,
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
