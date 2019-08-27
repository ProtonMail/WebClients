export const requestUsername = (NotificationEmail) => ({
    url: 'reset/username',
    method: 'post',
    data: { NotificationEmail }
});

export const validateResetToken = (username, token) => ({
    url: `reset/${username}/${token}`,
    method: 'get'
});

export const requestLoginResetToken = (data) => ({
    url: 'reset',
    method: 'post',
    data
});
