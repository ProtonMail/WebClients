import type {
    AddressKeysState,
    OrganizationKeyState,
    SecurityCheckupReduxState,
    SubscriptionState,
    UserInvitationsState,
    UserKeysState,
    UserSettingsState,
} from '@proton/account';
import type { CategoriesState, MailSettingState } from '@proton/mail';

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
