/* TODO: add all server events
 * in this type definition - it only
 * specifies the keys we're consuming
 * in the extension sagas for now */
import type { Invoice } from '@proton/payments';
import type { Address, Organization, Subscription, User, UserSettings } from '@proton/shared/lib/interfaces';

export enum ChannelType {
    USER = 'user',
    SHARE = 'share',
    SHARES = 'shares',
}

export enum ShareEventType {
    SHARE_DISABLED = 'SHARE_DISABLED',
    ITEMS_DELETED = 'ITEMS_DELETED',
}

export enum EventActions {
    DELETE,
    CREATE,
    UPDATE,
}

export type UserEvent = {
    More: 0 | 1;
    EventID: string;
    Refresh?: number;
    User?: User;
    UserSettings?: UserSettings;
    Addresses?: AddressEvent[];
    Subscription?: Subscription;
    Invoices?: Invoice;
    Organization?: Organization;
};

export type AddressEvent = {
    ID: string;
    Action: EventActions;
    Address: Address;
};

export type ShareEventPayload =
    | { type: ShareEventType.SHARE_DISABLED; shareId: string }
    | { type: ShareEventType.ITEMS_DELETED; shareId: string; itemIds: string[] };
