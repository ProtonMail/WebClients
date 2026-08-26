/**
 * Order collection of object by a specific key
 */
const orderBy = <T, K extends keyof T>(collection: T[], key: K) => {
    return collection.slice().sort((a, b) => {
        if (a[key] > b[key]) {
            return 1;
        }
        if (a[key] < b[key]) {
            return -1;
        }
        return 0;
    });
};

export default orderBy;
