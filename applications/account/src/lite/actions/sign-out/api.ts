export const signOutAllExternalSessions = (jwt: string) => ({
    url: `auth/v4/sessions/external/${encodeURIComponent(jwt)}`,
    method: 'delete',
});
