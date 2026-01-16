import { useCallback, useMemo } from 'react';

import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { useConversationCounts, useFolders, useLabels, useMessageCounts } from '@proton/mail';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useFlag } from '@proton/unleash';

import { getLocationElementsCount } from 'proton-mail/helpers/elements';
import { isConversationMode } from 'proton-mail/helpers/mailSettings';
import {
    getSelectAllBannerText,
    getSelectAllBannerTextWithLocation,
    getSelectAllButtonText,
} from 'proton-mail/helpers/selectAll';
import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';
import { layoutActions } from 'proton-mail/store/layout/layoutSlice';
import { selectSelectAll } from 'proton-mail/store/layout/layoutSliceSelectors';

interface Props {
    labelID: string;
}

export const useSelectAll = ({ labelID }: Props) => {
    const [mailSettings] = useMailSettings();
    const mailPageSize = mailSettings.PageSize;
    const [conversationCounts] = useConversationCounts();
    const [messageCounts] = useMessageCounts();
    const isConversation = isConversationMode(labelID, mailSettings);
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const dispatch = useMailDispatch();
    const selectAll = useMailSelector(selectSelectAll);
    const selectAllAvailable = useFlag('SelectAll');

    const locationCount = useMemo(() => {
        return getLocationElementsCount(labelID, conversationCounts || [], messageCounts || [], isConversation);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-CFA412
    }, [conversationCounts, messageCounts, labelID]);

    const getBannerText = useCallback(() => {
        return getBoldFormattedText(getSelectAllBannerText(isConversation, selectAll ? locationCount : mailPageSize));
    }, [isConversation, locationCount, mailPageSize, selectAll]);

    const getBannerTextWithLocation = useCallback(() => {
        return getSelectAllBannerTextWithLocation({
            conversationMode: isConversation,
            elementsCount: selectAll ? locationCount : mailPageSize,
            labelID,
            customLabels: labels,
            customFolders: folders,
        });
    }, [isConversation, locationCount, mailPageSize, selectAll, labelID, labels, folders]);

    const getButtonText = useCallback(() => {
        return getSelectAllButtonText({
            selectAll,
            elementsCount: locationCount,
            labelID,
            customLabels: labels,
            customFolders: folders,
        });
    }, [selectAll, locationCount, labelID, labels, folders]);

    const setSelectAll = (value: boolean) => {
        dispatch(layoutActions.setSelectAll(value));
    };

    return {
        selectAll,
        setSelectAll,
        locationCount,
        getBannerText,
        getBannerTextWithLocation,
        getButtonText,
        selectAllAvailable,
    };
};
