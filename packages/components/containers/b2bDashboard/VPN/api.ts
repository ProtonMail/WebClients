export interface OrganizationSettings {
    GatewayMonitoring: boolean;
}

export const getMonitoringSetting = () => ({
    url: 'vpn/v1/business/settings',
    method: 'get',
});

export const updateMonitoringSetting = (monitoring: boolean) => ({
    url: 'vpn/v1/business/settings',
    method: 'put',
    data: {
        GatewayMonitoring: monitoring,
    },
});
