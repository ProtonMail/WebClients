import type { GatewayIpModel } from '../gateways/GatewayIpModel';
import type { GatewayModel } from './GatewayModel';

export const queryVPNGateways = () => ({
    url: 'vpn/v1/business/gateways',
    method: 'get',
});

export const createVPNGateway = (data: GatewayModel) => ({
    url: 'vpn/v1/business/gateways',
    method: 'post',
    data,
});

export const addIpInVPNGateway = (data: GatewayIpModel) => ({
    url: 'vpn/v1/business/gateways/ip',
    method: 'post',
    data,
});

export const deleteVPNGateway = (ids: readonly string[]) => ({
    url: 'vpn/v1/business/gateways',
    method: 'delete',
    data: {
        LogicalIds: ids,
    },
});

export const renameVPNGateway = (currentName: string, newName: string) => ({
    url: 'vpn/v1/business/gateways',
    method: 'put',
    data: {
        CurrentName: currentName,
        NewName: newName,
    },
});

export const updateVPNGatewayUsers = (currentName: string, features: number, userIds?: readonly string[] | null) => ({
    url: 'vpn/v1/business/gateways',
    method: 'put',
    data: {
        CurrentName: currentName,
        NewName: currentName,
        Features: features,
        UserIds: userIds ?? null,
    },
});
