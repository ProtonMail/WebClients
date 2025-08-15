import { createAction } from '@reduxjs/toolkit';

import type { Filter } from '@proton/components/containers/filters/interfaces';
import { type Subscription } from '@proton/payments';
import type { Invoice, SavedPaymentMethod } from '@proton/payments';
import type { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type { EventItemUpdate } from '@proton/shared/lib/helpers/updateCollection';
import type {
    Address,
    ApiEnvironmentConfig,
    BreachAlertUpdateEvent,
    Domain,
    Group,
    GroupMember,
    GroupMembership,
    IncomingAddressForwarding,
    IncomingDefault,
    LabelCount,
    MailSettings,
    Member,
    Organization,
    OrganizationSettings,
    OutgoingAddressForwarding,
    PendingInvitation,
    SSO,
    User,
    UserSettings,
} from '@proton/shared/lib/interfaces';
import type { Category } from '@proton/shared/lib/interfaces/Category';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';
import type { RetentionRule } from '@proton/shared/lib/interfaces/RetentionRule';
import type { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';
import type {
    CalendarEventManager,
    CalendarMemberEventManager,
} from '@proton/shared/lib/interfaces/calendar/EventManager';
import type { Contact, ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import type { AuthDeviceOutput, MemberAuthDeviceOutput } from '@proton/shared/lib/keys/device';

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
    DriveShareRefresh?: {
        Action: EVENT_ACTIONS;
    };
    More: 0 | 1;
    EventID: string;
}

export const serverEvent = createAction('server event', (payload: EventLoop) => ({ payload }));
