import { useMemo } from 'react';

import generateUID from '@proton/atoms/generateUID';
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
                ...range(0, expectedLength - (inputElements?.length ?? 0)).map(() => ({
                    ID: generateUID(PLACEHOLDER_ID_PREFIX),
                })),
            ];
        }

        return inputElements ?? [];
    }, [loading, inputElements, expectedLength]);

    return elements;
};
