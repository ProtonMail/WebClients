import { FileAttachmentsContentView } from '@proton/pass/components/FileAttachments/FileAttachmentsView';
import { ItemHistoryStats } from '@proton/pass/components/Item/History/ItemHistoryStats';
import { MoreInfoDropdown } from '@proton/pass/components/Layout/Dropdown/MoreInfoDropdown';
import { ItemViewPanel } from '@proton/pass/components/Layout/Panel/ItemViewPanel';
import { SecureLinkCardList } from '@proton/pass/components/SecureLink/SecureLinkCardList';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { useItemViewInfo } from '@proton/pass/hooks/items/useItemViewInfo';
import type { ItemCustomType, ItemType } from '@proton/pass/types';

import { CustomContent } from './Custom.content';

export const CustomView = <T extends ItemCustomType>(itemViewProps: ItemViewProps<T>) => {
    const { revision, handleHistoryClick } = itemViewProps;
    const { revision: revisionNumber, shareId, itemId, createTime, modifyTime } = revision;
    const { getMoreInfoList } = useItemViewInfo({ shareId, itemId });

    return (
        <ItemViewPanel type={revision.data.type} {...(itemViewProps as ItemViewProps<ItemType>)}>
            <SecureLinkCardList shareId={shareId} itemId={itemId} />
            <CustomContent revision={revision} />
            <FileAttachmentsContentView revision={revision} />
            <ItemHistoryStats createTime={createTime} modifyTime={modifyTime} handleHistoryClick={handleHistoryClick} />
            <MoreInfoDropdown info={getMoreInfoList(revisionNumber - 1)} />
        </ItemViewPanel>
    );
};
