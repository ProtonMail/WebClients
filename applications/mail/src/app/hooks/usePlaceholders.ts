import { useMemo } from 'react';

import { generateUID } from '@proton/components';
import range from '@proton/utils/range';

import { Element } from '../models/element';

export const PLACEHOLDER_ID_PREFIX = 'placeholder';

export const usePlaceholders = (
    inputElements: Element[] | undefined,
    loading: boolean,
    expectedLength: number
): Element[] => {
    const placeholders: Element[] = useMemo(
        () => range(0, expectedLength).map(() => ({ ID: generateUID(PLACEHOLDER_ID_PREFIX) })),
        [loading, expectedLength]
    );

    const elements: Element[] = useMemo(
        () => (loading ? placeholders : (inputElements as Element[])),
        [loading, inputElements]
    );

    return elements;
};
