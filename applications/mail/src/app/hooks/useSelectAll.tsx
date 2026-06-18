import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { isConversationMode } from 'proton-mail/helpers/mailSettings';
import {
    getSelectAllBannerText,
    getSelectAllBannerTextWithLocation,
    getSelectAllButtonText,
} from 'proton-mail/helpers/selectAll';
import { selectCategoryIDs } from 'proton-mail/store/elements/elementsSelectors';
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

    const categoryIDs = useMailSelector(selectCategoryIDs);
    // The label must be the category when in inbox and with categories
    const currentLabel = labelID === MAILBOX_LABEL_IDS.INBOX && categoryIDs.length > 0 ? categoryIDs[0] : labelID;

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
            currentLabel,
            customLabels: labels,
            customFolders: folders,
        });
    };

    const getButtonText = () => {
        return getSelectAllButtonText({
            selectAll,
            elementsCount: locationCount.Total,
            currentLabel,
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
