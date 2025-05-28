import type { FC } from 'react';

import { FileAttachmentsContentView } from '@proton/pass/components/FileAttachments/FileAttachmentsView';
import { CreditCardContent } from '@proton/pass/components/Item/CreditCard/CreditCard.content';
import { ItemHistoryStats } from '@proton/pass/components/Item/History/ItemHistoryStats';
import { MoreInfoDropdown } from '@proton/pass/components/Layout/Dropdown/MoreInfoDropdown';
import { ItemViewPanel } from '@proton/pass/components/Layout/Panel/ItemViewPanel';
import { SecureLinkCardList } from '@proton/pass/components/SecureLink/SecureLinkCardList';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { useItemViewInfo } from '@proton/pass/hooks/items/useItemViewInfo';

export const CreditCardView: FC<ItemViewProps<'creditCard'>> = (itemViewProps) => {
    const { revision, handleHistoryClick } = itemViewProps;
    const { createTime, modifyTime, revision: revisionNumber, shareId, itemId } = revision;
    const { getMoreInfoList } = useItemViewInfo({ shareId, itemId });

    return (
        <ItemViewPanel type="creditCard" {...itemViewProps}>
            <SecureLinkCardList shareId={shareId} itemId={itemId} />
            <CreditCardContent revision={revision} />
            <FileAttachmentsContentView revision={revision} />
            <ItemHistoryStats createTime={createTime} modifyTime={modifyTime} handleHistoryClick={handleHistoryClick} />
            <MoreInfoDropdown info={getMoreInfoList(revisionNumber - 1)} />
        </ItemViewPanel>
    );
};
