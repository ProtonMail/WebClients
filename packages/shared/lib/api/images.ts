export const getImage = (Url: string) => ({
    method: 'get',
    url: 'images',
    params: { Url },
});
