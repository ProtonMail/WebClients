export const calculateGridLayout = (count: number, isSmallScreen: boolean) => {
    if (count === 0) {
        return { cols: 0, rows: 0 };
    }
    if (count === 1) {
        return { cols: 1, rows: 1 };
    }
    if (count === 2) {
        if (isSmallScreen) {
            return { cols: 1, rows: 2 };
        }
        return { cols: 2, rows: 1 };
    }

    if (count === 3 && isSmallScreen) {
        return { cols: 1, rows: 3 };
    }
    if (count <= 4) {
        return { cols: 2, rows: 2 };
    }
    if (count <= 6) {
        return { cols: 3, rows: 2 };
    }
    if (count <= 8) {
        return { cols: 4, rows: 2 };
    }
    if (count <= 12) {
        return { cols: 4, rows: 3 };
    }
    return { cols: 5, rows: 3 };
};
