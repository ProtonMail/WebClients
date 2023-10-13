export const partition = <T>(array: T[], splitOn: (item: T) => boolean): [T[], T[]] => {
    const pass: T[] = [];
    const fail: T[] = [];

    array.forEach((item) => (splitOn(item) ? pass : fail).push(item));

    return [pass, fail];
};
