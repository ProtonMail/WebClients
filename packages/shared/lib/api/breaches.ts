export const getBreaches = (Recent?: boolean) => ({
    url: 'account/v4/breaches',
    method: 'get',
    params: { Recent },
});

export const updateBreachState = (data: { ID: string; State: number }) => ({
    url: 'account/v4/breaches/state',
    method: 'put',
    data,
});
