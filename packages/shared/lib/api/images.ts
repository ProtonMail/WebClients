export const getImage = (Url: string, DryRun = 0) => ({
    method: 'get',
    url: 'images',
    params: { Url, DryRun },
});
