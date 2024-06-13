import { format } from 'date-fns';
import startCase from 'lodash/startCase';
import { c } from 'ttag';

import downloadFile from '@proton/shared/lib/helpers/downloadFile';

import { PassEvent } from '.';

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
            return c('Info').t`User invited to organization`;
        case 'NewUserInviteDeleted':
            return c('Info').t`Invite for User deleted`;
        case 'ItemCreated':
            return c('Info').t`Item created in vault`;
        case 'ItemUpdated':
            return c('Info').t`Item updated in vault`;
        case 'ItemUsed':
            return c('Info').t`Item autofilled in vault`;
        case 'ItemRead':
            return c('Info').t`Item read in vault`;
        case 'ItemDeleted':
            return c('Info').t`Item deleted in vault`;
        case 'ItemTrashed':
            return c('Info').t`Item trashed in vault`;
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
        default:
            return c('Info').t`Unknown event type`;
    }
};

export const getEventNameText = (event: string): string => {
    switch (event) {
        case 'InviteCreated':
            return c('Info').t`Invite Created`;
        case 'InviteAccepted':
            return c('Info').t`Invite Accepted`;
        case 'InviteDeleted':
            return c('Info').t`Invite Deleted`;
        case 'InviteRejected':
            return c('Info').t`Invite Rejected`;
        case 'NewUserInviteCreated':
            return c('Info').t`New User Invite Created`;
        case 'NewUserInviteDeleted':
            return c('Info').t`New User Invite Deleted`;
        case 'ItemCreated':
            return c('Info').t`Item Created`;
        case 'ItemUpdated':
            return c('Info').t`Item Updated`;
        case 'ItemUsed':
            return c('Info').t`Item Autofilled`;
        case 'ItemRead':
            return c('Info').t`Item Read`;
        case 'ItemDeleted':
            return c('Info').t`Item Deleted`;
        case 'ItemTrashed':
            return c('Info').t`Item Trashed`;
        case 'ItemUntrashed':
            return c('Info').t`Item Untrashed`;
        case 'ItemChangedFlags':
            return c('Info').t`Item Changed Flags`;
        case 'ShareCreated':
            return c('Info').t`Share Created`;
        case 'ShareDeleted':
            return c('Info').t`Share Deleted`;
        case 'ShareUpdated':
            return c('Info').t`Share Updated`;
        case 'VaultCreated':
            return c('Info').t`Vault Created`;
        case 'VaultDeleted':
            return c('Info').t`Vault Deleted`;
        case 'VaultUpdated':
            return c('Info').t`Vault Updated`;
        default:
            return c('Info').t`All Events `;
    }
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

export const handlePassEventsDownload = (events: PassEvent[]) => {
    const header = ['Time', 'User Name', 'User Email', 'Event', 'Description', 'IP'];

    const csvData = events.reduce(
        (csv, { time, user, event, ip }) => {
            const rowData = [time, user.name, user.email, event, getDesciptionText(event), ip];

            return csv + rowData.join(',') + '\n';
        },
        header.join(',') + '\n'
    );

    const blob = new Blob([csvData], { type: 'text/csv' });
    const filename = 'PassEventLogs.csv';
    downloadFile(blob, filename);
};

export const getUniqueEventTypes = (eventLogs: PassEvent[]) => {
    const events = eventLogs.map((log) => log.event);
    const uniqueEvents = ['All Events', ...new Set(events)];
    return uniqueEvents.map((event) => startCase(event));
};
