export const requestUsername = (Email: string) => ({
    url: 'reset/username',
    method: 'post',
    data: { Email },
});

export const validateResetToken = (username: string, token: string) => ({
    url: `reset/${username}/${token}`,
    method: 'get',
});

export const requestLoginResetToken = (data: { Username: string; Email?: string; Phone?: string }) => ({
    url: 'reset',
    method: 'post',
    data,
});
