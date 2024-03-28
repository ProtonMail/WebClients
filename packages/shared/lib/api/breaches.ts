export const getBreaches = (Recent?: boolean) => ({
    url: 'account/v4/breaches',
    method: 'get',
    params: { Recent },
});
