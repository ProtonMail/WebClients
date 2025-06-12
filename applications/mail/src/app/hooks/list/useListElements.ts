import { useEffect } from 'react';

import { useMailELDTMetric } from 'proton-mail/metrics/useMailELDTMetric';
import { useMailPTTMetric } from 'proton-mail/metrics/useMailPTTMetric';

import useEncryptedSearchList from '../../components/list/useEncryptedSearchList';
import { PLACEHOLDER_ID_PREFIX, usePlaceholders } from '../../hooks/usePlaceholders';
import type { Element } from '../../models/element';

/**
 * Hook to manage list elements, loading states, and placeholders
 */
export const useListElements = ({
    inputElements = [],
    loading = false,
    placeholderCount = 0,
    labelID,
    isSearch = false,
    page,
    total,
}: {
    inputElements: Element[];
    loading: boolean;
    placeholderCount: number;
    labelID?: string;
    isSearch?: boolean;
    page?: number;
    total?: number;
}) => {
    const elements = usePlaceholders(inputElements, loading, placeholderCount);
    const isEmpty = elements.length === 0;

    const { stopELDTMetric } = useMailELDTMetric();
    const { stopPTTMetric } = useMailPTTMetric();

    useEffect(() => {
        if (elements.some((element) => element.ID.startsWith(PLACEHOLDER_ID_PREFIX))) {
            return;
        }

        if (labelID) {
            stopELDTMetric(labelID);
        }

        if (!loading) {
            stopPTTMetric();
        }
    }, [elements, loading, labelID, stopELDTMetric, stopPTTMetric]);

    const { isESLoading, showESSlowToolbar, loadingElement, useLoadingElement } = useEncryptedSearchList(
        isSearch,
        loading,
        page || 0,
        total || 0
    );

    return {
        elements,
        isEmpty,
        isLoading: loading,
        isESLoading,
        showESSlowToolbar,
        loadingElement,
        useLoadingElement,
    };
};
