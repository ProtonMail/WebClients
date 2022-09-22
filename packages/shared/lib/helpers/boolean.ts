/**
 * This function is the same as (bool) => +bool,
 * but the return type is 0 | 1 instead of number
 */
export const booleanToNumber = (bool: boolean): 0 | 1 => {
    return bool ? 1 : 0;
};
