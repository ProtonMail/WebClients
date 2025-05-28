import type { FC } from 'react';

import { FileAttachmentsContentView } from '@proton/pass/components/FileAttachments/FileAttachmentsView';
import { ItemHistoryStats } from '@proton/pass/components/Item/History/ItemHistoryStats';
import { IdentityContent } from '@proton/pass/components/Item/Identity/Identity.content';
import { MoreInfoDropdown } from '@proton/pass/components/Layout/Dropdown/MoreInfoDropdown';
import { ItemViewPanel } from '@proton/pass/components/Layout/Panel/ItemViewPanel';
import { SecureLinkCardList } from '@proton/pass/components/SecureLink/SecureLinkCardList';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { useItemViewInfo } from '@proton/pass/hooks/items/useItemViewInfo';

export const IdentityView: FC<ItemViewProps<'identity'>> = (itemViewProps) => {
    const { revision, handleHistoryClick } = itemViewProps;
    const { createTime, lastUseTime, modifyTime, revision: revisionNumber, shareId, itemId } = revision;
    const { getMoreInfoList } = useItemViewInfo({ shareId, itemId });

    return (
        <ItemViewPanel type="identity" {...itemViewProps}>
            <SecureLinkCardList shareId={shareId} itemId={itemId} />
            <IdentityContent revision={revision} />
            <FileAttachmentsContentView revision={revision} />
            <ItemHistoryStats
                lastUseTime={lastUseTime}
                createTime={createTime}
                modifyTime={modifyTime}
                handleHistoryClick={handleHistoryClick}
            />
            <MoreInfoDropdown info={getMoreInfoList(revisionNumber - 1)} />
        </ItemViewPanel>
    );
};
