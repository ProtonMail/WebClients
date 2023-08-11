import { c } from 'ttag';

import { SERVER_FEATURES } from '@proton/shared/lib/constants';

import { GatewayDto } from './GatewayDto';
import { GatewayLogical } from './GatewayLogical';
import { GatewayServer } from './GatewayServer';
import { GatewayUser } from './GatewayUser';

export const getSuffix = (name: string | undefined) => name?.match(/#\d+$/)?.[0] || '';

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

const getInitialQuantities = (countries: readonly string[]) => {
    const quantities: Record<string, 1> = {};

    // Add 2 by default in different countries (take 1 in each of the 2 first countries)
    for (let i = 0; i < 2 && countries[i]; i++) {
        quantities[countries[i] as string] = 1;
    }

    return quantities;
};

export const getTotalAdded = (quantities: Record<string, number> | null | undefined): number =>
    Object.values(quantities || {}).reduce((total, quantity) => total + quantity, 0);

export const getInitialModel = (countries: readonly string[]): GatewayDto => ({
    country: countries[0] || 'US',
    name: '',
    features: 0,
    userIds: [],
    quantities: getInitialQuantities(countries),
});

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
