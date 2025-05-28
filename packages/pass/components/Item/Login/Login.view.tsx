import type { FC } from 'react';

import { FileAttachmentsContentView } from '@proton/pass/components/FileAttachments/FileAttachmentsView';
import { ItemHistoryStats } from '@proton/pass/components/Item/History/ItemHistoryStats';
import { LoginContent } from '@proton/pass/components/Item/Login/Login.content';
import { MoreInfoDropdown } from '@proton/pass/components/Layout/Dropdown/MoreInfoDropdown';
import { ItemViewPanel } from '@proton/pass/components/Layout/Panel/ItemViewPanel';
import { ItemReport } from '@proton/pass/components/Monitor/Item/ItemReport';
import { SecureLinkCardList } from '@proton/pass/components/SecureLink/SecureLinkCardList';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { useItemViewInfo } from '@proton/pass/hooks/items/useItemViewInfo';
import { isMonitored } from '@proton/pass/lib/items/item.predicates';

export const LoginView: FC<ItemViewProps<'login'>> = (itemViewProps) => {
    const { revision, handleHistoryClick } = itemViewProps;
    const { createTime, lastUseTime, modifyTime, revision: revisionNumber, shareId, itemId } = revision;
    const { getMoreInfoList } = useItemViewInfo({ shareId, itemId });

    return (
        <ItemViewPanel type="login" {...itemViewProps}>
            {isMonitored(revision) && <ItemReport shareId={shareId} itemId={itemId} />}
            <SecureLinkCardList shareId={shareId} itemId={itemId} />
            <LoginContent revision={revision} />
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
