/**
 * Returns all elements included in the first array BUT NOT in the second one
 */
const diff = <T>(arr1: T[], arr2: T[]) => arr1.filter((a) => !arr2.includes(a));

export default diff;
