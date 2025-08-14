// Type predicate to ensure we only return non-undefined values
export function isNonNullable<T>(value: NonNullable<T> | undefined): value is NonNullable<T> {
    return value !== undefined;
}
