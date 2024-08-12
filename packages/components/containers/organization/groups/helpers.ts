export const getAddressSuggestedLocalPart = (groupName: string) => {
    return groupName
        .toLowerCase()
        .replace(/[^a-z0-9-_\.\s+]/g, '')
        .replace(/\s+/g, '-');
};
