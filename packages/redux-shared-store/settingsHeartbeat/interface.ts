import type { AddressKeysState } from '@proton/account/addressKeys';
import type { OrganizationKeyState } from '@proton/account/organizationKey';
import type { SubscriptionState } from '@proton/account/subscription';
import type { UserInvitationsState } from '@proton/account/userInvitations';
import type { UserKeysState } from '@proton/account/userKeys';
import type { UserSettingsState } from '@proton/account/userSettings';
import type { CategoriesState } from '@proton/mail/store/labels';
import type { MailSettingState } from '@proton/mail/store/mailSettings';

export interface RequiredState
    extends
        AddressKeysState,
        UserKeysState,
        UserSettingsState,
        OrganizationKeyState,
        UserInvitationsState,
        MailSettingState,
        CategoriesState,
        SubscriptionState {}
