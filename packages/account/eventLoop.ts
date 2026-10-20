import { createAction } from '@reduxjs/toolkit';

import type { Entitlement } from '@proton/payments/core/entitlements/interface';
import type { Invoice, SavedPaymentMethod } from '@proton/payments/core/interface';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import type { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type { EventItemUpdate } from '@proton/shared/lib/helpers/updateCollection';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type {
    IncomingAddressForwarding,
    OutgoingAddressForwarding,
} from '@proton/shared/lib/interfaces/AddressForwarding';
import type { ApiEnvironmentConfig } from '@proton/shared/lib/interfaces/ApiEnvironmentConfig';
import type { BreachAlertUpdateEvent } from '@proton/shared/lib/interfaces/BreachesCount';
import type { Category } from '@proton/shared/lib/interfaces/Category';
import type { Domain } from '@proton/shared/lib/interfaces/Domain';
import type { Group } from '@proton/shared/lib/interfaces/Group';
import type { GroupMember, GroupMembership } from '@proton/shared/lib/interfaces/GroupMember';
import type { IncomingDefault } from '@proton/shared/lib/interfaces/IncomingDefault';
import type { LabelCount } from '@proton/shared/lib/interfaces/Label';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import type { Member } from '@proton/shared/lib/interfaces/Member';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';
import type { Organization, OrganizationSettings } from '@proton/shared/lib/interfaces/Organization';
import type { PendingInvitation } from '@proton/shared/lib/interfaces/PendingInvitation';
import type { RetentionRule } from '@proton/shared/lib/interfaces/RetentionRule';
import type { SSO } from '@proton/shared/lib/interfaces/SSO';
import type { User } from '@proton/shared/lib/interfaces/User';
import type { UserSettings } from '@proton/shared/lib/interfaces/UserSettings';
import type { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar/Calendar';
import type {
    CalendarEventManager,
    CalendarMemberEventManager,
} from '@proton/shared/lib/interfaces/calendar/EventManager';
import type { Contact, ContactEmail } from '@proton/shared/lib/interfaces/contacts/Contact';
import type { AuthDeviceOutput, MemberAuthDeviceOutput } from '@proton/shared/lib/keys/device';
import type { Filter } from '@proton/sieve/filterModel';

import type { IncomingDelegatedAccessOutput, OutgoingDelegatedAccessOutput } from './delegatedAccess/interface';

export interface EventLoop {
    AuthDevices?: EventItemUpdate<AuthDeviceOutput, 'AuthDevice'>[];
    MemberAuthDevices?: EventItemUpdate<MemberAuthDeviceOutput, 'MemberAuthDevice'>[];
    User?: User;
    Filters?: EventItemUpdate<Filter, 'Filter'>[];
    Domains?: EventItemUpdate<Domain, 'Domain'>[];
    Addresses?: EventItemUpdate<Address, 'Address'>[];
    CalendarUserSettings?: CalendarUserSettings;
    Contacts?: EventItemUpdate<Contact, 'Contact'>[];
    ContactEmails?: EventItemUpdate<ContactEmail, 'ContactEmail'>[];
    Calendars?: CalendarEventManager[];
    CalendarMembers?: CalendarMemberEventManager[];
    Organization?: Omit<Organization, 'Settings'>;
    OrganizationSettings?: OrganizationSettings;
    UserSettings?: UserSettings;
    MailSettings?: MailSettings;
    UserInvitations?: EventItemUpdate<PendingInvitation, 'UserInvitation'>[];
    Labels?: EventItemUpdate<Category, 'Label'>[];
    Members?: EventItemUpdate<Member, 'Member'>[];
    MessageCounts?: LabelCount[];
    Notices?: string[];
    ConversationCounts?: LabelCount[];
    PaymentMethods?: EventItemUpdate<SavedPaymentMethod, 'PaymentMethod'>[];
    Invoices?: EventItemUpdate<Invoice, 'Invoice'>[];
    IncomingAddressForwardings?: EventItemUpdate<IncomingAddressForwarding, 'IncomingAddressForwarding'>[];
    OutgoingAddressForwardings?: EventItemUpdate<OutgoingAddressForwarding, 'OutgoingAddressForwarding'>[];
    IncomingDefaults?: EventItemUpdate<IncomingDefault, 'IncomingDefault'>[];
    Subscription?: Subscription & { UpcomingSubscription?: Subscription };
    OrganizationEntitlements?: Entitlement[];
    MemberEntitlements?: Entitlement[];
    Config?: ApiEnvironmentConfig;
    SSO?: EventItemUpdate<SSO, 'SSO'>[];
    UsedSpace?: User['UsedSpace'];
    UsedBaseSpace?: User['UsedBaseSpace'];
    UsedDriveSpace?: User['UsedDriveSpace'];
    ProductUsedSpace?: User['ProductUsedSpace'];
    Refresh?: number;
    BreachAlerts?: BreachAlertUpdateEvent[];
    Groups?: EventItemUpdate<Group, 'Group'>[];
    GroupMembers?: EventItemUpdate<GroupMember, 'GroupMember'>[];
    GroupMemberships?: EventItemUpdate<GroupMembership, 'GroupMembership'>[];
    NewsletterSubscriptions?: EventItemUpdate<NewsletterSubscription, 'NewsletterSubscription'>[];
    RetentionRules?: EventItemUpdate<RetentionRule, 'RetentionRule'>[];
    OutgoingDelegatedAccess?: EventItemUpdate<OutgoingDelegatedAccessOutput, 'DelegatedAccess'>[];
    IncomingDelegatedAccess?: EventItemUpdate<IncomingDelegatedAccessOutput, 'DelegatedAccess'>[];
    DriveShareRefresh?: {
        Action: EVENT_ACTIONS;
    };
    More: 0 | 1;
    EventID: string;
}

export const serverEvent = createAction('server event', (payload: EventLoop) => ({ payload }));
