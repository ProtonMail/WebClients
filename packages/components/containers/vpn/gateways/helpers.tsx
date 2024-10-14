import { c } from 'ttag';

import { SERVER_FEATURES } from '@proton/shared/lib/constants';

import { type CountryOptions, getLocalizedCountryByAbbr } from '../../../helpers/countries';
import type { GatewayDto } from './GatewayDto';
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

const getUsersList = (userIds: readonly string[], users: readonly GatewayUser[], key = '') =>
    userIds.length
        ? userIds.map((id) => {
              const user = users?.find((user) => user.ID === id);

              return <div key={'logical-users-' + key + '-' + id}>{user?.Name || user?.Email}</div>;
          })
        : '0';

export const getMembers = (users: readonly GatewayUser[], logical: GatewayLogical) =>
    logical.Features & SERVER_FEATURES.DOUBLE_RESTRICTION
        ? getUsersList(logical.Users, users, logical.ID)
        : /* translator: The whole organization has access to the gateway */ c('Info').t`Whole organization`;

export const getLocationId = (location: GatewayLocation): string => {
    const id = btoa(location.Country + '\n' + (location.City || ''));

    if (!(id in locations)) {
        locations[id] = location;
    }

    return id;
};

export const getLocationDisplayName = (location: GatewayLocation, countryOptions: CountryOptions): string => {
    const country = getLocalizedCountryByAbbr(location.Country, countryOptions) || location.Country;
    return country + (location.TranslatedCity ? ' - ' + location.TranslatedCity : '');
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
});
