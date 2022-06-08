/**
 * Extract the elements from an array that are unique according to a comparator function
 */
const uniqueBy = <T>(array: T[], comparator: (t: T) => any) => {
    const seen = new Set();
    return array.filter((value) => {
        const computed = comparator(value);
        const hasSeen = seen.has(computed);
        if (!hasSeen) {
            seen.add(computed);
        }
        return !hasSeen;
    });
};

export default uniqueBy;
