import { useMemo } from 'react';

import useFlag from '@proton/components/containers/unleash/useFlag';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { useConversationCounts, useFolders, useLabels, useMessageCounts } from '@proton/components/hooks';

import { getLocationElementsCount } from 'proton-mail/helpers/elements';
import { isConversationMode } from 'proton-mail/helpers/mailSettings';
import {
    getSelectAllBannerText,
    getSelectAllBannerTextWithLocation,
    getSelectAllButtonText,
} from 'proton-mail/helpers/selectAll';
import useMailModel from 'proton-mail/hooks/useMailModel';
import { layoutActions } from 'proton-mail/logic/layout/layoutSlice';
import { selectSelectAll } from 'proton-mail/logic/layout/layoutSliceSelectors';
import { useAppDispatch, useAppSelector } from 'proton-mail/logic/store';

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
    const dispatch = useAppDispatch();
    const selectAll = useAppSelector(selectSelectAll);
    const selectAllAvailable = useFlag('SelectAll');

    const locationCount = useMemo(() => {
        return getLocationElementsCount(labelID, conversationCounts, messageCounts, isConversation);
    }, [conversationCounts, messageCounts, labelID]);

    const getBannerText = () => {
        return getBoldFormattedText(getSelectAllBannerText(isConversation, selectAll ? locationCount : mailPageSize));
    };

    const getBannerTextWithLocation = () => {
        return getSelectAllBannerTextWithLocation(
            isConversation,
            selectAll ? locationCount : mailPageSize,
            labelID,
            labels,
            folders
        );
    };

    const getButtonText = () => {
        return getSelectAllButtonText(selectAll, locationCount, labelID, labels, folders);
    };

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
