export const emergencyAccessId = 'emergency-access';
export const recoveryContactsId = 'recovery-contacts';

// Route that is in the email links
export const getTrustedContactRoute = (prefix = '', suffix = '') => {
    return `${prefix}/trusted-contacts${suffix}`;
};

export const getViewEmergencyAccessRoute = (id: string) => {
    const search = new URLSearchParams({ id, action: 'view' }).toString();
    // This is a direct path to recovery to avoid a trusted-contacts route redirect
    return `/recovery?${search}#${emergencyAccessId}`;
};

export const getViewRecoveryContactInfoRoute = (id: string) => {
    const search = new URLSearchParams({ id, action: 'recover-info' }).toString();
    // This is a direct path to recovery to avoid a trusted-contacts route redirect
    return `/recovery?${search}#${recoveryContactsId}`;
};

export const getViewRecoveryContactRecoverRoute = (id: string) => {
    const search = new URLSearchParams({ id, action: 'recover-token' }).toString();
    // This is a direct path to recovery to avoid a trusted-contacts route redirect
    return `/recovery?${search}#${recoveryContactsId}`;
};

export const getHelpRecoveryContactRecoverRoute = (id: string) => {
    const search = new URLSearchParams({ id, action: 'help-recover' }).toString();
    // This is a direct path to recovery to avoid a trusted-contacts route redirect
    return `/recovery?${search}#${recoveryContactsId}`;
};
