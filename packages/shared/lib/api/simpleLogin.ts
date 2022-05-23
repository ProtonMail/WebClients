export const getSLAccountLinked = () => ({
    method: 'get',
    url: 'simple_login/v1/user',
});

export const getSLSubscription = () => ({
    method: 'get',
    url: 'simple_login/v1/subscription',
});

export const createSLUser = (Redirect?: 'browser_extension' | 'home') => ({
    method: 'post',
    url: 'simple_login/v1/user',
    data: { Redirect },
});
