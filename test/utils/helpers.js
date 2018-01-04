export const generateModuleName = () => {
    return `test${Math.random().toString(32).slice(2, 12)}-${Date.now()}`;
};
