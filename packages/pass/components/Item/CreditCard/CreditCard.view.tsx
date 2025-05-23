import type { FC } from 'react';

import { FileAttachmentsContentView } from '@proton/pass/components/FileAttachments/FileAttachmentsView';
import { CreditCardContent } from '@proton/pass/components/Item/CreditCard/CreditCard.content';
import { ItemHistoryStats } from '@proton/pass/components/Item/History/ItemHistoryStats';
import { MoreInfoDropdown } from '@proton/pass/components/Layout/Dropdown/MoreInfoDropdown';
import { ItemViewPanel } from '@proton/pass/components/Layout/Panel/ItemViewPanel';
import { SecureLinkCardList } from '@proton/pass/components/SecureLink/SecureLinkCardList';
import type { ItemViewProps } from '@proton/pass/components/Views/types';

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
