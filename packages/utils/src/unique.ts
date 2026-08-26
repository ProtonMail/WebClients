import uniqueBy from './uniqueBy';

const unique = <T>(array: T[]) => uniqueBy(array, (x) => x);

export default unique;
