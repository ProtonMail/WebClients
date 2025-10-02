import { useMemo } from 'react';

import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import range from '@proton/utils/range';

import type { Element } from '../models/element';

export const PLACEHOLDER_ID_PREFIX = 'placeholder';

type ElementOrPlaceholder =
    | Element
    | {
          ID: string;
      };

interface UsePlaceholdersProps {
    inputElements: ElementOrPlaceholder[] | undefined;
    loading: boolean;
    expectedLength: number;
    // If true it allow to return more placeholders than the page size setting
    unsafeLength?: boolean;
}

export const usePlaceholders = ({
    inputElements,
    loading,
    expectedLength,
    unsafeLength = false,
}: UsePlaceholdersProps): Element[] => {
    const [mailSettings] = useMailSettings();

    const elements: ElementOrPlaceholder[] = useMemo(() => {
        if (loading) {
            const length = expectedLength - (inputElements?.length ?? 0);
            const inputRange = unsafeLength ? length : Math.min(length, mailSettings.PageSize);

            return [
                ...(inputElements ?? []),
                ...range(0, inputRange).map((_, index) => ({
                    ID: `${PLACEHOLDER_ID_PREFIX}-${index}`,
                })),
            ];
        }

        return inputElements ?? [];
    }, [loading, inputElements, expectedLength, unsafeLength, mailSettings.PageSize]);

    return elements;
};
