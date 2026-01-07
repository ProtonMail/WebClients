import { c } from 'ttag';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import Icon from '@proton/components/components/icon/Icon';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import { type CountryOptions, getLocalizedCountryByAbbr } from '@proton/payments';
import { SERVER_FEATURES } from '@proton/shared/lib/constants';

import type { GatewayDto } from './GatewayDto';
import type { GatewayGroup } from './GatewayGroup';
import type { GatewayLocation } from './GatewayLocation';
import type { GatewayLogical } from './GatewayLogical';
import type { GatewayServer } from './GatewayServer';
import type { GatewayUser } from './GatewayUser';

export const getSuffix = (name: string | undefined) => name?.match(/#\d+$/)?.[0] || '';

const locations: Record<string, GatewayLocation> = {};

const getAverageLoad = (servers: GatewayServer[]) =>
    servers.reduce((load, server) => load + server.Load, 0) / servers.length;

const getColorForLoad = (load: number): string => {
    if (load > 90) {
        return 'danger';
    }

    if (load > 75) {
        return 'warning';
    }

    return 'success';
};

export const getFormattedLoad = (servers: GatewayServer[]) => {
    const load = Math.max(0, Math.min(100, Math.round(getAverageLoad(servers))));

    return <span className={'color-' + getColorForLoad(load)}>{load}%</span>;
};

export const getTotalAdded = (quantities: Record<string, number> | null | undefined): number =>
    Object.values(quantities || {}).reduce((total, quantity) => total + quantity, 0);

interface UsersListProps {
    userIds: readonly string[];
    users: readonly GatewayUser[];
    keyPrefix?: string;
}

export const UsersList = ({ userIds, users, keyPrefix = '' }: UsersListProps) => {
    if (!userIds.length) {
        return '0';
    }

    return userIds.map((id) => {
        const user = users?.find((u) => u.ID === id);

        return (
            <DropdownButton
                className="mb-1 enabled-chip flex items-center gap-1 px-2 rounded-lg"
                shape="ghost"
                size="small"
                key={`logical-users-${keyPrefix}-${id}`}
            >
                <Icon name="user-filled" />
                <div className="text-base text-semibold">{user?.Name || user?.Email}</div>
            </DropdownButton>
        );
    });
};
interface GroupItemProps {
    group: GatewayGroup | undefined;
    keyPrefix: string;
    id: string;
}
const GroupItem = ({ group, keyPrefix, id }: GroupItemProps) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <DropdownButton
                className="mb-1 enabled-chip flex items-center gap-1 px-2 rounded-lg"
                ref={anchorRef}
                isOpen={isOpen}
                onClick={(e) => {
                    e.stopPropagation();
                    toggle();
                }}
                shape="ghost"
                size="small"
            >
                <Icon name="users-filled" />
                <div className="text-base text-semibold">{group?.Name}</div>
            </DropdownButton>

            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                {group?.Users.map((user) => (
                    <div
                        key={`logical-users-${keyPrefix}-${id}-${(user as any).UserID}`}
                        className="flex items-center gap-1 py-2 px-4"
                    >
                        <Icon name="user-filled" />
                        <div className="text-base">{user.Name}</div>
                    </div>
                ))}
            </Dropdown>
        </>
    );
};
interface GroupsListProps {
    groupIds: readonly string[];
    groups: readonly GatewayGroup[];
    keyPrefix?: string;
}
export const GroupsList = ({ groupIds, groups, keyPrefix = '' }: GroupsListProps) => {
    if (!groupIds.length) {
        return '0';
    }

    return groupIds.map((id) => {
        const group = groups.find((g) => g.GroupID === id);
        return <GroupItem key={`logical-group-${keyPrefix}-${id}`} group={group} keyPrefix={keyPrefix} id={id} />;
    });
};

export const getMembers = (users: readonly GatewayUser[], groups: readonly GatewayGroup[], logical: GatewayLogical) => {
    if (
        (logical.Features & SERVER_FEATURES.DOUBLE_RESTRICTION) !== 0 &&
        (logical.Users.length > 0 || logical.Groups.length > 0)
    ) {
        return logical.Users && logical.Users.length > 0 ? (
            <UsersList userIds={logical.Users} users={users} keyPrefix={logical.ID} />
        ) : (
            <GroupsList groupIds={logical.Groups} groups={groups} keyPrefix={logical.ID} />
        );
    } else {
        /* translator: The whole organization has access to the gateway */
        return c('Info').t`Whole organization`;
    }
};
export const getLocationId = (location: GatewayLocation): string => {
    const id = btoa(location.Country + '\n' + location.City);

    if (!(id in locations)) {
        locations[id] = location;
    }

    return id;
};

export const getLocationDisplayName = (location: GatewayLocation, countryOptions: CountryOptions): string => {
    const country = getLocalizedCountryByAbbr(location.Country, countryOptions) || location.Country;
    return country + ' - ' + location.TranslatedCity;
};

export const getLocationFromId = (locationId: string): GatewayLocation => {
    return locations[locationId];
};

const getInitialQuantities = (locations: readonly GatewayLocation[]) => {
    const quantities: Record<string, 1> = {};

    // Add 1 by default in first location
    for (let i = 0; i < 0 && locations[i]; i++) {
        quantities[getLocationId(locations[i])] = 1;
    }

    return quantities;
};

export const getInitialModel = (locations: readonly GatewayLocation[]): GatewayDto => ({
    location: locations[0],
    name: '',
    features: 0,
    userIds: [],
    quantities: getInitialQuantities(locations),
    unassignedIpQuantities: {},
    groupIds: [],
});
