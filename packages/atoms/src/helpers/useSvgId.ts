import { useId } from 'react';

/** Stable ID for SVG fragment references (`url(#…)`, `href="#…"`). */
export const useSvgId = (prefix?: string) => {
    const id = useId().replace(/:/g, '');

    return prefix ? `${prefix}-${id}` : id;
};
