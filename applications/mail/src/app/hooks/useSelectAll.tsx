import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

import { isConversationMode } from 'proton-mail/helpers/mailSettings';
import {
    getSelectAllBannerText,
    getSelectAllBannerTextWithLocation,
    getSelectAllButtonText,
} from 'proton-mail/helpers/selectAll';
import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';
import { layoutActions } from 'proton-mail/store/layout/layoutSlice';
import { selectSelectAll } from 'proton-mail/store/layout/layoutSliceSelectors';

import { useMailboxCounter } from './mailboxCounter/useMailboxCounter';

interface Props {
    labelID: string;
}

export const useSelectAll = ({ labelID }: Props) => {
    const [mailSettings] = useMailSettings();
    const mailPageSize = mailSettings.PageSize;
    const isConversation = isConversationMode(labelID, mailSettings);
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const dispatch = useMailDispatch();
    const selectAll = useMailSelector(selectSelectAll);

    const { getCurrentLocationCount } = useMailboxCounter();
    const locationCount = getCurrentLocationCount();

    const getBannerText = () => {
        return getBoldFormattedText(
            getSelectAllBannerText(isConversation, selectAll ? locationCount.Total : mailPageSize)
        );
    };

    const getBannerTextWithLocation = () => {
        return getSelectAllBannerTextWithLocation({
            conversationMode: isConversation,
            elementsCount: selectAll ? locationCount.Total : mailPageSize,
            labelID,
            customLabels: labels,
            customFolders: folders,
        });
    };

    const getButtonText = () => {
        return getSelectAllButtonText({
            selectAll,
            elementsCount: locationCount.Total,
            labelID,
            customLabels: labels,
            customFolders: folders,
        });
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
    };
};
