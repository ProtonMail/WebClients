export const load = (page: string) => ({
    method: 'get',
    url: 'core/v4/load',
    params: { page },
});
