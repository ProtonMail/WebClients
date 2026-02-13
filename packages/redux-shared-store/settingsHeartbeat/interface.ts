import type {
    AddressKeysState,
    OrganizationKeyState,
    SecurityCheckupReduxState,
    SubscriptionState,
    UserInvitationsState,
    UserKeysState,
    UserSettingsState,
} from '@proton/account';
import type { CategoriesState } from '@proton/mail/store/labels';
import type { MailSettingState } from '@proton/mail/store/mailSettings';

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
