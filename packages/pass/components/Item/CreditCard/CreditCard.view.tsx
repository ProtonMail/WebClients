import type { FC } from 'react';

import { FileAttachmentsContentView } from '../../FileAttachments/FileAttachmentsView';
import { MoreInfoDropdown } from '../../Layout/Dropdown/MoreInfoDropdown';
import { ItemViewPanel } from '../../Layout/Panel/ItemViewPanel';
import { SecureLinkCardList } from '../../SecureLink/SecureLinkCardList';
import type { ItemViewProps } from '../../Views/types';
import { ItemHistoryStats } from '../History/ItemHistoryStats';
import { CreditCardContent } from './CreditCard.content';

export const CreditCardView: FC<ItemViewProps<'creditCard'>> = (itemViewProps) => {
    const { revision, share } = itemViewProps;
    const { vaultId } = share;
    const { createTime, modifyTime, revision: revisionNumber, shareId, itemId, lastUseTime } = revision;

    return (
        <ItemViewPanel type="creditCard" {...itemViewProps}>
            {({ onHistory }) => (
                <>
                    <SecureLinkCardList shareId={shareId} itemId={itemId} />
                    <CreditCardContent revision={revision} />
                    <FileAttachmentsContentView revision={revision} />
                    <ItemHistoryStats
                        createTime={createTime}
                        lastUseTime={lastUseTime}
                        modifyTime={modifyTime}
                        handleHistoryClick={onHistory}
                    />
                    <MoreInfoDropdown shareId={shareId} itemId={itemId} revision={revisionNumber} vaultId={vaultId} />
                </>
            )}
        </ItemViewPanel>
    );
};
