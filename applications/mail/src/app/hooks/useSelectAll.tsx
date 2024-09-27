import { useCallback, useMemo } from 'react';

import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { useFolders, useLabels, useMessageCounts } from '@proton/components/hooks';
import { useConversationCounts } from '@proton/mail/counts/conversationCounts';
import { useFlag } from '@proton/unleash';

import { getLocationElementsCount } from 'proton-mail/helpers/elements';
import { isConversationMode } from 'proton-mail/helpers/mailSettings';
import {
    getSelectAllBannerText,
    getSelectAllBannerTextWithLocation,
    getSelectAllButtonText,
} from 'proton-mail/helpers/selectAll';
import useMailModel from 'proton-mail/hooks/useMailModel';
import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';
import { layoutActions } from 'proton-mail/store/layout/layoutSlice';
import { selectSelectAll } from 'proton-mail/store/layout/layoutSliceSelectors';

interface Props {
    labelID: string;
}

export const useSelectAll = ({ labelID }: Props) => {
    const mailSettings = useMailModel('MailSettings');
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
    }, [conversationCounts, messageCounts, labelID]);

    const getBannerText = useCallback(() => {
        return getBoldFormattedText(getSelectAllBannerText(isConversation, selectAll ? locationCount : mailPageSize));
    }, [isConversation, locationCount, mailPageSize, selectAll]);

    const getBannerTextWithLocation = useCallback(() => {
        return getSelectAllBannerTextWithLocation(
            isConversation,
            selectAll ? locationCount : mailPageSize,
            labelID,
            labels,
            folders
        );
    }, [isConversation, locationCount, mailPageSize, selectAll, labelID, labels, folders]);

    const getButtonText = useCallback(() => {
        return getSelectAllButtonText(selectAll, locationCount, labelID, labels, folders);
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
