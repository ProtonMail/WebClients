export const getKeyByID = <T extends { ID: string }>(keys: T[], ID: string): T | undefined => {
    return keys.find(({ ID: otherID }) => otherID === ID);
};
