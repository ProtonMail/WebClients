import { format } from 'date-fns';
import startCase from 'lodash/startCase';
import { c } from 'ttag';

import downloadFile from '@proton/shared/lib/helpers/downloadFile';

import type { PassEvent } from './interface';

export const PAGINATION_LIMIT = 50;
export const ALL_EVENTS_DEFAULT = 'All Events';

enum Event {
    InviteCreated = 'InviteCreated',
    InviteAccepted = 'InviteAccepted',
    InviteDeleted = 'InviteDeleted',
    InviteRejected = 'InviteRejected',
    NewUserInviteCreated = 'NewUserInviteCreated',
    NewUserInviteDeleted = 'NewUserInviteDeleted',
    ItemCreated = 'ItemCreated',
    ItemUpdated = 'ItemUpdated',
    ItemUsed = 'ItemUsed',
    ItemRead = 'ItemRead',
    ItemDeleted = 'ItemDeleted',
    ItemTrashed = 'ItemTrashed',
    ItemUntrashed = 'ItemUntrashed',
    ItemChangedFlags = 'ItemChangedFlags',
    ShareCreated = 'ShareCreated',
    ShareDeleted = 'ShareDeleted',
    ShareUpdated = 'ShareUpdated',
    VaultCreated = 'VaultCreated',
    VaultDeleted = 'VaultDeleted',
    VaultUpdated = 'VaultUpdated',
    BreachCustomEmailCreated = 'BreachCustomEmailCreated',
    BreachCustomEmailValidated = 'BreachCustomEmailValidated',
    BreachCustomEmailDeleted = 'BreachCustomEmailDeleted',
}

export const getDesciptionText = (event: string): string => {
    switch (event) {
        case 'InviteCreated':
            return c('Info').t`Invite for organization created`;
        case 'InviteAccepted':
            return c('Info').t`Invite for organization accepted`;
        case 'InviteDeleted':
            return c('Info').t`Invite deleted`;
        case 'InviteRejected':
            return c('Info').t`Invite rejected`;
        case 'NewUserInviteCreated':
            return c('Info').t`New user invited to organization`;
        case 'NewUserInviteDeleted':
            return c('Info').t`Invite for new user deleted`;
        case 'ItemCreated':
            return c('Info').t`Item created in vault`;
        case 'ItemUpdated':
            return c('Info').t`Item updated in vault`;
        case 'ItemUsed':
            return c('Info').t`Item autofilled in vault`;
        case 'ItemRead':
            return c('Info').t`Item read in vault`;
        case 'ItemDeleted':
            return c('Info').t`Item deleted from vault`;
        case 'ItemTrashed':
            return c('Info').t`Item in vault trashed`;
        case 'ItemUntrashed':
            return c('Info').t`Item in vault untrashed`;
        case 'ItemChangedFlags':
            return c('Info').t`Item flags changed in vault`;
        case 'ShareCreated':
            return c('Info').t`Vault shared with email`;
        case 'ShareDeleted':
            return c('Info').t`Shared vault deleted`;
        case 'ShareUpdated':
            return c('Info').t`Shared vault updated`;
        case 'VaultCreated':
            return c('Info').t`Vault created`;
        case 'VaultDeleted':
            return c('Info').t`Vault deleted`;
        case 'VaultUpdated':
            return c('Info').t`Vault updated`;
        case 'BreachCustomEmailCreated':
            return c('Info').t`Pass Monitor - custom email created`;
        case 'BreachCustomEmailValidated':
            return c('Info').t`Pass Monitor - custom email confirmed`;
        case 'BreachCustomEmailDeleted':
            return c('Info').t`Pass Monitor - custom email deleted`;
        default:
            return c('Info').t`Unknown event type`;
    }
};

export const getDescriptionTextWithLink = (event: string, vaultLink: React.JSX.Element) => {
    switch (event) {
        case 'InviteCreated':
            return c('Info').jt`Invite for organization created`;
        case 'InviteAccepted':
            return c('Info').jt`Invite for organization accepted`;
        case 'InviteDeleted':
            return c('Info').jt`Invite deleted`;
        case 'InviteRejected':
            return c('Info').jt`Invite rejected`;
        case 'NewUserInviteCreated':
            return c('Info').jt`New user invited to organization`;
        case 'NewUserInviteDeleted':
            return c('Info').jt`Invite for new user deleted`;
        case 'ItemCreated':
            return c('Info').jt`Item created in ${vaultLink}`;
        case 'ItemUpdated':
            return c('Info').jt`Item updated in ${vaultLink}`;
        case 'ItemUsed':
            return c('Info').jt`Item autofilled in ${vaultLink}`;
        case 'ItemRead':
            return c('Info').jt`Item read in ${vaultLink}`;
        case 'ItemDeleted':
            return c('Info').jt`Item deleted from ${vaultLink}`;
        case 'ItemTrashed':
            return c('Info').jt`Item in ${vaultLink} trashed`;
        case 'ItemUntrashed':
            return c('Info').jt`Item in ${vaultLink} untrashed`;
        case 'ItemChangedFlags':
            return c('Info').jt`Item flags changed in ${vaultLink}`;
        case 'ShareCreated':
            return c('Info').jt`${vaultLink} shared with email`;
        case 'ShareDeleted':
            return c('Info').jt`Shared ${vaultLink} deleted`;
        case 'ShareUpdated':
            return c('Info').jt`Shared ${vaultLink} updated`;
        case 'VaultCreated':
            return c('Info').jt`${vaultLink} created`;
        case 'VaultDeleted':
            return c('Info').jt`${vaultLink} deleted`;
        case 'VaultUpdated':
            return c('Info').jt`${vaultLink} updated`;
        case 'BreachCustomEmailCreated':
            return c('Info').jt`Pass Monitor - custom email created`;
        case 'BreachCustomEmailValidated':
            return c('Info').jt`Pass Monitor - custom email confirmed`;
        case 'BreachCustomEmailDeleted':
            return c('Info').jt`Pass Monitor - custom email deleted`;
        default:
            return c('Info').jt`Unknown event type`;
    }
};

export interface EventObject {
    EventType: string;
    EventTypeName: string;
}

export const getConnectionEvents = (items: EventObject[]): EventObject[] => {
    const defaultEvent: EventObject = {
        EventType: ALL_EVENTS_DEFAULT,
        EventTypeName: ALL_EVENTS_DEFAULT,
    };
    return [defaultEvent, ...items];
};

const eventKeys = Object.keys(Event) as (keyof typeof Event)[];
export const uniquePassEventsArray = [ALL_EVENTS_DEFAULT, ...eventKeys];

export const getLocalTimeStringFromDate = (time: Date) => {
    return format(time, "yyyy-MM-dd'T'HH:mm:ssxxx");
};

export const isPartialIP = (input: string) => {
    const ipPartialRegex = /^(\d{1,3}\.){0,3}\d{0,3}$/;
    return ipPartialRegex.test(input);
};

export const isPartialEmail = (input: string) => {
    if (input.includes('@')) {
        const [localPart, domainPart] = input.split('@');
        if (localPart && !domainPart.includes(' ')) {
            return true;
        }
    } else {
        if (!input.includes(' ')) {
            return true;
        }
    }
    return false;
};

export const getSearchType = (input: string) => {
    if (!input) {
        return 'empty';
    }
    if (isPartialIP(input)) {
        return 'ip';
    }
    if (isPartialEmail(input)) {
        return 'email';
    }
    return 'invalid';
};

export const downloadPassEvents = async (response: any) => {
    const contentDisposition = response.headers.get('content-disposition');
    const match = contentDisposition.match(/attachment; filename=(.*)/);

    if (!match) {
        return null;
    }

    const blob = await response.blob();
    downloadFile(blob, match[1]);
};

export const getUniqueEventTypes = (eventLogs: PassEvent[]) => {
    const events = eventLogs.map((log) => log.eventType);
    const uniqueEvents = ['All Events', ...new Set(events)];
    return uniqueEvents.map((event) => startCase(event));
};
