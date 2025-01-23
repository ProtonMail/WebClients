export const removeById = <T extends { ID: string }>(list: T[], value: { ID: string }) => {
    const index = list.findIndex(({ ID }) => ID === value.ID);
    if (index === -1) {
        return list;
    }
    return list.toSpliced(index, 1);
};
