import { useMemo } from 'react';

import range from '@proton/utils/range';

import type { Element } from '../models/element';

export const PLACEHOLDER_ID_PREFIX = 'placeholder';

type ElementOrPlaceholder =
    | Element
    | {
          ID: string;
      };

export const usePlaceholders = (
    inputElements: ElementOrPlaceholder[] | undefined,
    loading: boolean,
    expectedLength: number
): Element[] => {
    const elements: ElementOrPlaceholder[] = useMemo(() => {
        if (loading) {
            return [
                ...(inputElements ?? []),
                ...range(0, expectedLength - (inputElements?.length ?? 0)).map((_, index) => ({
                    ID: `${PLACEHOLDER_ID_PREFIX}-${index}`,
                })),
            ];
        }

        return inputElements ?? [];
    }, [loading, inputElements, expectedLength]);

    return elements;
};
