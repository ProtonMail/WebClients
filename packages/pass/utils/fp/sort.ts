export const sortOn =
    <T extends { [key: string]: any }, K extends keyof T>(key: K, order: 'ASC' | 'DESC' = 'DESC') =>
    (a: T, b: T): number =>
        order === 'DESC' ? b[key] - a[key] : a[key] - b[key];
