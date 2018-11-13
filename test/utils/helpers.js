export const generateModuleName = () => {
    return `test${Math.random().toString(32).slice(2, 12)}-${Date.now()}`;
};

export const log = (data, scope) => {

    if (scope) {
        console.log('');
        console.log('-------------------------');
        console.log(scope);
        console.log('');
    }
    if (typeof data === 'object') {
        return console.log(JSON.stringify(data, null, 2));
    }
    console.log(data);
};
