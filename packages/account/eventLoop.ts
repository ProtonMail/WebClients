import { createAction } from '@reduxjs/toolkit';

import type { Filter } from '@proton/components/containers/filters/interfaces';
import type { SavedPaymentMethod } from '@proton/payments';
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
    LabelCount,
    MailSettings,
    Member,
    Organization,
    OrganizationSettings,
    OutgoingAddressForwarding,
    PendingInvitation,
    SSO,
    Subscription,
    User,
    UserSettings,
} from '@proton/shared/lib/interfaces';
import type { Category } from '@proton/shared/lib/interfaces/Category';
import type { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';
import type {
    CalendarEventManager,
    CalendarMemberEventManager,
} from '@proton/shared/lib/interfaces/calendar/EventManager';
import type { Contact, ContactEmail } from '@proton/shared/lib/interfaces/contacts';

export interface EventLoop {
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
    ConversationCounts?: LabelCount[];
    PaymentMethods?: EventItemUpdate<SavedPaymentMethod, 'PaymentMethod'>[];
    IncomingAddressForwardings?: EventItemUpdate<IncomingAddressForwarding, 'IncomingAddressForwarding'>[];
    OutgoingAddressForwardings?: EventItemUpdate<OutgoingAddressForwarding, 'OutgoingAddressForwarding'>[];
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
}

export const serverEvent = createAction('server event', (payload: EventLoop) => ({ payload }));
