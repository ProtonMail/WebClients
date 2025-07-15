export const updateMonitoringSetting = (monitoring: number) => ({
    url: 'core/v4/organizations/settings/logauth',
    method: 'put',
    data: {
        LogAuth: monitoring,
    },
});

export const enableSentinelMonitoring = () => ({
    url: 'core/v4/organizations/settings/highsecurity',
    method: 'post',
});

export const disableSentinelMonitoring = () => ({
    url: 'core/v4/organizations/settings/highsecurity',
    method: 'delete',
});
