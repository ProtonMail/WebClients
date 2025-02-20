export const isRootFolder = (pathname: string) => {
    return pathname.slice(1, pathname.length).split('/').length === 1;
};
