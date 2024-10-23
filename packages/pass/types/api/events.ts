/* TODO: add all server events
 * in this type definition - it only
 * specifies the keys we're consuming
 * in the extension sagas for now */
import type { Invoice } from '@proton/payments';
import type { EventItemUpdate } from '@proton/shared/lib/helpers/updateCollection';
import type { Address, Organization, Subscription, User, UserSettings } from '@proton/shared/lib/interfaces';
import type { AuthDeviceOutput } from '@proton/shared/lib/keys/device';

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
    Addresses?: AddressEvent[];
    AuthDevices?: EventItemUpdate<AuthDeviceOutput, 'AuthDevice'>[];
    EventID: string;
    Invoices?: Invoice;
    More: 0 | 1;
    Organization?: Organization;
    Refresh?: number;
    Subscription?: Subscription;
    User?: User;
    UserSettings?: UserSettings;
};

export type AddressEvent = {
    ID: string;
    Action: EventActions;
    Address: Address;
};

export type ShareEventPayload =
    | { type: ShareEventType.SHARE_DISABLED; shareId: string }
    | { type: ShareEventType.ITEMS_DELETED; shareId: string; itemIds: string[] };
