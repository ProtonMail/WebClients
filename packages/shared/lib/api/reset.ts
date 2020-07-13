export const requestUsername = (NotificationEmail: string) => ({
    url: 'reset/username',
    method: 'post',
    data: { NotificationEmail }
});

export const validateResetToken = (username: string, token: string) => ({
    url: `reset/${username}/${token}`,
    method: 'get'
});

export const requestLoginResetToken = (data: { Username: string; NotificationEmail: string }) => ({
    url: 'reset',
    method: 'post',
    data
});
