import type { UpdateAlwaysOnPolicyData } from '../types/AlwaysOn';

export const queryAlwaysOnPolicy = () => ({
    url: 'vpn/v1/business/always-on-policy',
    method: 'get',
});

export const updateAlwaysOnPolicy = (data: UpdateAlwaysOnPolicyData) => ({
    url: 'vpn/v1/business/always-on-policy',
    method: 'put',
    data,
});
