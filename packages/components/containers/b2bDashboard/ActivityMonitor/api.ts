export const updateMonitoringSetting = (monitoring: number) => ({
    url: 'core/v4/organizations/settings/logauth',
    method: 'put',
    data: {
        LogAuth: monitoring,
    },
});

export const enableHighSecurityOrganization = () => ({
    url: 'core/v4/organizations/settings/highsecurity',
    method: 'post',
});

export const disableHighSecurityOrganization = () => ({
    url: 'core/v4/organizations/settings/highsecurity',
    method: 'delete',
});
