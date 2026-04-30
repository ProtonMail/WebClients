export const ignoredActions: string[] = [
    'userKeys/fetch/fulfilled',
    'addressKeys/fulfilled',
    'organizationKey/fetch/fulfilled',
    'events/synchronizeEvents',
    'events/updateInvite',
];
export const ignoredPaths: (string | RegExp)[] = [/userKeys/, /addressKeys/, /organizationKey/, /events/];
