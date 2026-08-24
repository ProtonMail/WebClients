import type { ItemCustomType, ItemType } from '../../../types';
import { FileAttachmentsContentView } from '../../FileAttachments/FileAttachmentsView';
import { MoreInfoDropdown } from '../../Layout/Dropdown/MoreInfoDropdown';
import { ItemViewPanel } from '../../Layout/Panel/ItemViewPanel';
import { SecureLinkCardList } from '../../SecureLink/SecureLinkCardList';
import type { ItemViewProps } from '../../Views/types';
import { ItemHistoryStats } from '../History/ItemHistoryStats';
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
