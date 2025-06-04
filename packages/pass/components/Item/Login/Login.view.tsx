import type { FC } from 'react';

import { FileAttachmentsContentView } from '@proton/pass/components/FileAttachments/FileAttachmentsView';
import { AutotypeDropdownLogin } from '@proton/pass/components/Item/Autotype/AutotypeDropdownLogin';
import { ItemHistoryStats } from '@proton/pass/components/Item/History/ItemHistoryStats';
import { LoginContent } from '@proton/pass/components/Item/Login/Login.content';
import { MoreInfoDropdown } from '@proton/pass/components/Layout/Dropdown/MoreInfoDropdown';
import { ItemViewPanel } from '@proton/pass/components/Layout/Panel/ItemViewPanel';
import { ItemReport } from '@proton/pass/components/Monitor/Item/ItemReport';
import { SecureLinkCardList } from '@proton/pass/components/SecureLink/SecureLinkCardList';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { isMonitored } from '@proton/pass/lib/items/item.predicates';

export const LoginView: FC<ItemViewProps<'login'>> = (itemViewProps) => {
    const { revision, handleHistoryClick, share } = itemViewProps;
    const { createTime, lastUseTime, modifyTime, revision: revisionNumber, shareId, itemId, data } = revision;

    return (
        <ItemViewPanel
            type="login"
            quickActions={DESKTOP_BUILD ? [<AutotypeDropdownLogin data={data} key="autotype-dropdown" />] : undefined}
            {...itemViewProps}
        >
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
            <MoreInfoDropdown shareId={shareId} itemId={itemId} revision={revisionNumber} vaultId={share.vaultId} />
        </ItemViewPanel>
    );
};
