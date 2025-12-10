import { FileAttachmentsContentView } from '@proton/pass/components/FileAttachments/FileAttachmentsView';
import { ItemHistoryStats } from '@proton/pass/components/Item/History/ItemHistoryStats';
import { MoreInfoDropdown } from '@proton/pass/components/Layout/Dropdown/MoreInfoDropdown';
import { ItemViewPanel } from '@proton/pass/components/Layout/Panel/ItemViewPanel';
import { SecureLinkCardList } from '@proton/pass/components/SecureLink/SecureLinkCardList';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import type { ItemCustomType, ItemType } from '@proton/pass/types';

import { CustomContent } from './Custom.content';

export const CustomView = <T extends ItemCustomType>(itemViewProps: ItemViewProps<T>) => {
    const { revision, share } = itemViewProps;
    const { vaultId } = share;
    const { revision: revisionNumber, shareId, itemId, createTime, modifyTime } = revision;

    return (
        <ItemViewPanel type={revision.data.type} {...(itemViewProps as ItemViewProps<ItemType>)}>
            {({ onHistory }) => (
                <>
                    <SecureLinkCardList shareId={shareId} itemId={itemId} />
                    <CustomContent revision={revision} />
                    <FileAttachmentsContentView revision={revision} />
                    <ItemHistoryStats createTime={createTime} modifyTime={modifyTime} handleHistoryClick={onHistory} />
                    <MoreInfoDropdown shareId={shareId} itemId={itemId} revision={revisionNumber} vaultId={vaultId} />
                </>
            )}
        </ItemViewPanel>
    );
};
