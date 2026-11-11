export const ignoredActions: string[] = [
    'userKeys/fetch/fulfilled',
    'addressKeys/fulfilled',
    'organizationKey/fetch/fulfilled',
    'events/synchronizeEvents',
    'events/updateInvite',
    // Failed address audits hold the `KeyTransparencyError` that failed them
    'kt/selfAuditResult',
];
export const ignoredPaths: (string | RegExp)[] = [
    /userKeys/,
    /addressKeys/,
    /organizationKey/,
    /events/,
    'kt.selfAuditResult',
];
