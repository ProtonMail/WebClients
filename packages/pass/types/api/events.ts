import type { Invoice } from '@proton/payments/core/interface';
import type { Subscription } from '@proton/payments/core/subscription/interface';
/* TODO: add all server events
 * in this type definition - it only
 * specifies the keys we're consuming
 * in the extension sagas for now */
import type { EventItemUpdate } from '@proton/shared/lib/helpers/updateCollection';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { GroupMember, GroupMembershipReturn } from '@proton/shared/lib/interfaces/GroupMember';
import type { Organization } from '@proton/shared/lib/interfaces/Organization';
import type { User } from '@proton/shared/lib/interfaces/User';
import type { UserSettings } from '@proton/shared/lib/interfaces/UserSettings';
import type { AuthDeviceOutput } from '@proton/shared/lib/keys/device';

export enum EventActions {
    DELETE = 0,
    CREATE = 1,
    UPDATE = 2,
}

export type CoreEvent = {
    Addresses?: AddressEvent[];
    AuthDevices?: EventItemUpdate<AuthDeviceOutput, 'AuthDevice'>[];
    EventID: string;
    Invoices?: Invoice;
    More: boolean;
    Organization?: Organization;
    Refresh?: boolean;
    Subscription?: Subscription;
    User?: User;
    UserSettings?: UserSettings;
    GroupMembers?: GroupMemberEvent[];
};

type AddressEvent = {
    ID: string;
    Action: EventActions;
    Address: Address;
};

type GroupMemberEvent = {
    ID: string;
    Action: EventActions;
    GroupMember: GroupMember & GroupMembershipReturn;
};
