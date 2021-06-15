export const undoActions = (Token: string) => ({
    url: 'mail/v4/undoactions',
    method: 'post',
    data: { Token },
});
