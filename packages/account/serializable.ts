export const ignoredActions: string[] = [
    'userKeys/fetch/fulfilled',
    'addressKeys/fetch/fulfilled',
    'organizationKey/fetch/fulfilled',
];
export const ignoredPaths: (string | RegExp)[] = [/userKeys/, /addressKeys/, /organizationKey/];
