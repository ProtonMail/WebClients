export const getSignedKeyLists = (params: { SinceEpochID: number; Email: string }) => ({
    url: 'keys/signedkeylists',
    method: 'get',
    params,
});
