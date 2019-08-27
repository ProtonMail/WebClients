export const requestUsername = (NotificationEmail) => ({
    url: 'reset/username',
    method: 'post',
    data: { NotificationEmail }
});

export const validateResetToken = (username, token) => ({
    url: `reset/${username}/${token}`,
    method: 'post'
});

export const requestLoginResetToken = (data) => ({
    url: 'reset',
    method: 'post',
    data
});
