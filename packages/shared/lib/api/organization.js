export const getOrganization = () => ({
    url: 'organizations',
    method: 'get'
});

export const getOrganizationKeys = () => ({
    url: 'organizations/keys',
    method: 'get'
});

export const updateOrganizationName = (Name) => ({
    url: 'organizations/name',
    method: 'put',
    data: { Name }
});

export const updateOrganizationEmail = (Email) => ({
    url: 'organizations/email',
    method: 'put',
    data: { Email }
});

export const updateOrganizationTheme = (Theme) => ({
    url: 'organizations/theme',
    method: 'put',
    data: { Theme }
});

export const updateTwoFactor = (GracePeriod) => ({
    url: 'organizations/2fa',
    method: 'put',
    data: { GracePeriod }
});
