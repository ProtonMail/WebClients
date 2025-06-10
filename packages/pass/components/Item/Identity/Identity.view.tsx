import type { FC } from 'react';

import { FileAttachmentsContentView } from '@proton/pass/components/FileAttachments/FileAttachmentsView';
import { ItemHistoryStats } from '@proton/pass/components/Item/History/ItemHistoryStats';
import { IdentityContent } from '@proton/pass/components/Item/Identity/Identity.content';
import { MoreInfoDropdown } from '@proton/pass/components/Layout/Dropdown/MoreInfoDropdown';
import { ItemViewPanel } from '@proton/pass/components/Layout/Panel/ItemViewPanel';
import { SecureLinkCardList } from '@proton/pass/components/SecureLink/SecureLinkCardList';
import type { ItemViewProps } from '@proton/pass/components/Views/types';

export const IdentityView: FC<ItemViewProps<'identity'>> = (itemViewProps) => {
    const { revision, handleHistoryClick, share } = itemViewProps;
    const { createTime, lastUseTime, modifyTime, revision: revisionNumber, shareId, itemId } = revision;

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
            <MoreInfoDropdown shareId={shareId} itemId={itemId} revision={revisionNumber} vaultId={share.vaultId} />
        </ItemViewPanel>
    );
};
