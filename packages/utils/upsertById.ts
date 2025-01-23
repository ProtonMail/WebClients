export const upsertById = <T extends { ID: string }>(list: T[], value: T) => {
    const index = list.findIndex(({ ID }) => ID === value.ID);
    if (index === -1) {
        return [...list, value];
    }
    return list.with(index, value);
};
