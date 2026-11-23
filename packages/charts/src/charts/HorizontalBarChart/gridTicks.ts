export const gridTicks = (min: number, max: number, count: number): { value: number }[] => {
    if (count < 2 || max <= min) {
        return [];
    }

    const step = (max - min) / (count - 1);

    return Array.from({ length: count }, (_line, index) => ({ value: min + step * index }));
};
