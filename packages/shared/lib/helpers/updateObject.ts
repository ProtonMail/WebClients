const updateObject = <T>(model: T, newModel: Partial<T>) => ({
    ...model,
    ...newModel,
});

export default updateObject;
