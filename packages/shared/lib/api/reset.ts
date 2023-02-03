type RequestUsernamePayload =
    | {
          Email: string;
      }
    | {
          Phone: string;
      };
export const requestUsername = (data: RequestUsernamePayload) => ({
    url: 'core/v4/reset/username',
    method: 'post',
    data,
});

export const validateResetToken = (username: string, token: string) => ({
    url: `core/v4/reset/${username}/${token}`,
    method: 'get',
});

export const requestLoginResetToken = (data: { Username: string; Email?: string; Phone?: string }) => ({
    url: 'core/v4/reset',
    method: 'post',
    data,
});
