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

export const getUnreadBreachesCount = () => ({
    url: 'account/v4/breaches/unread/count',
    method: 'get',
});

export const updateBreachEmailNotificationsState = (data: any) => ({
    url: 'account/v1/breaches/email-notifications',
    method: 'PATCH',
    data,
});
