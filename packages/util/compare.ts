/**
 * Basic comparator function that transforms order via >,< into the numeric order that sorting functions typically require
 */
const compare = (a: any, b: any) => {
    if (a > b) {
        return 1;
    }
    if (a < b) {
        return -1;
    }
    return 0;
};

export default compare;
