import type { FC } from 'react';

import { FileAttachmentsContentView } from '../../FileAttachments/FileAttachmentsView';
import { MoreInfoDropdown } from '../../Layout/Dropdown/MoreInfoDropdown';
import { ItemViewPanel } from '../../Layout/Panel/ItemViewPanel';
import { SecureLinkCardList } from '../../SecureLink/SecureLinkCardList';
import type { ItemViewProps } from '../../Views/types';
import { ItemHistoryStats } from '../History/ItemHistoryStats';
import { IdentityContent } from './Identity.content';

export const IdentityView: FC<ItemViewProps<'identity'>> = (itemViewProps) => {
    const { revision, share } = itemViewProps;
    const { vaultId } = share;
    const { createTime, lastUseTime, modifyTime, revision: revisionNumber, shareId, itemId } = revision;

    return (
        <ItemViewPanel type="identity" {...itemViewProps}>
            {({ onHistory }) => (
                <>
                    <SecureLinkCardList shareId={shareId} itemId={itemId} />
                    <IdentityContent revision={revision} />
                    <FileAttachmentsContentView revision={revision} />
                    <ItemHistoryStats
                        lastUseTime={lastUseTime}
                        createTime={createTime}
                        modifyTime={modifyTime}
                        handleHistoryClick={onHistory}
                    />
                    <MoreInfoDropdown shareId={shareId} itemId={itemId} revision={revisionNumber} vaultId={vaultId} />
                </>
            )}
        </ItemViewPanel>
    );
};
