import { createAction } from '@reduxjs/toolkit';

import type { Filter } from '@proton/components/containers/filters/interfaces';
import type { SavedPaymentMethod } from '@proton/components/payments/core';
import type { EventItemUpdate } from '@proton/shared/lib/helpers/updateCollection';
import type {
    Address,
    ApiEnvironmentConfig,
    Domain,
    IncomingAddressForwarding,
    MailSettings,
    Member,
    Organization,
    OutgoingAddressForwarding,
    PendingInvitation,
    Subscription,
    User,
    UserSettings,
} from '@proton/shared/lib/interfaces';
import type { Contact, ContactEmail } from '@proton/shared/lib/interfaces/contacts';

interface EventLoop {
    User?: User;
    Filters?: EventItemUpdate<Filter, 'Filter'>[];
    Domains?: EventItemUpdate<Domain, 'Domain'>[];
    Addresses?: EventItemUpdate<Address, 'Address'>[];
    Contacts?: EventItemUpdate<Contact, 'Contact'>[];
    ContactEmails?: EventItemUpdate<ContactEmail, 'ContactEmail'>[];
    Organization?: Organization;
    UserSettings?: UserSettings;
    MailSettings?: MailSettings;
    UserInvitations?: EventItemUpdate<PendingInvitation, 'UserInvitation'>[];
    Labels?: EventItemUpdate<any, 'Label'>[];
    Members?: EventItemUpdate<Member, 'Member'>[];
    PaymentMethods?: EventItemUpdate<SavedPaymentMethod, 'PaymentMethod'>[];
    IncomingAddressForwardings?: EventItemUpdate<IncomingAddressForwarding, 'IncomingAddressForwarding'>[];
    OutgoingAddressForwardings?: EventItemUpdate<OutgoingAddressForwarding, 'OutgoingAddressForwarding'>[];
    Subscription?: Subscription & { UpcomingSubscription?: Subscription };
    Config?: ApiEnvironmentConfig;
    UsedSpace?: number;
    Refresh?: number;
}

export const serverEvent = createAction('server event', (payload: EventLoop) => ({ payload }));
