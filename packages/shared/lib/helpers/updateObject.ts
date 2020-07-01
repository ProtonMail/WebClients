const updateObject = <T extends object>(model: T, newModel: Partial<T>) => ({
    ...model,
    ...newModel
});

export default updateObject;
