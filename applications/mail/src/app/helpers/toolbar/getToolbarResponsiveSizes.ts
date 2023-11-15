export const getToolbarResponsiveSizes = (breakpoint?: string) => {
    const localIsTiny = breakpoint === 'extratiny' || breakpoint === 'tiny';
    const localIsExtraTiny = breakpoint === 'extratiny';
    const localIsNarrow = breakpoint === 'extratiny' || breakpoint === 'tiny' || breakpoint === 'small';

    return {
        localIsTiny,
        localIsExtraTiny,
        localIsNarrow,
    };
};
