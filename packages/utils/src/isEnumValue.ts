/**
 * Type guard function to check if the given value is a value defined by the enum
 */
function isEnumValue<T extends Record<string, string | number>>(
    value: string | number,
    enumObj: T
): value is T[keyof T] {
    return Object.values(enumObj).includes(value as T[keyof T]);
}

export default isEnumValue;
