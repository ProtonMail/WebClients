import type { Predicate, TypePredicate } from '@proton/pass/utils/fp/predicates';

type PartitionResult<T, P extends Predicate> =
    P extends TypePredicate<T, infer U> ? [U[], Exclude<T, U>[]] : [T[], T[]];

export const partition = <T, P extends Predicate<[T]>>(array: T[], splitOn: P) => {
    const pass: T[] = [];
    const fail: T[] = [];

    array.forEach((item) => (splitOn(item) ? pass : fail).push(item));

    return [pass, fail] as PartitionResult<T, P>;
};
