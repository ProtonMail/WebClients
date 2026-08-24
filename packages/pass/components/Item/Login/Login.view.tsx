import type { FC } from 'react';

import { useAutotypeShortcut } from '../../../hooks/autotype/useAutotypeShortcut';
import { isMonitored } from '../../../lib/items/item.predicates';
import { FileAttachmentsContentView } from '../../FileAttachments/FileAttachmentsView';
import { MoreInfoDropdown } from '../../Layout/Dropdown/MoreInfoDropdown';
import { ItemViewPanel } from '../../Layout/Panel/ItemViewPanel';
import { ItemReport } from '../../Monitor/Item/ItemReport';
import { SecureLinkCardList } from '../../SecureLink/SecureLinkCardList';
import type { ItemViewProps } from '../../Views/types';
import { AutotypeDropdownLogin } from '../Autotype/AutotypeDropdownLogin';
import { ItemHistoryStats } from '../History/ItemHistoryStats';
import { LoginContent } from './Login.content';

export const LoginView: FC<ItemViewProps<'login'>> = (itemViewProps) => {
    const { revision, share } = itemViewProps;
    const { vaultId } = share;
    const { createTime, lastUseTime, modifyTime, revision: revisionNumber, shareId, itemId, data } = revision;

    useAutotypeShortcut(data);

    return (
        <ItemViewPanel
            type="login"
            quickActions={DESKTOP_BUILD ? [<AutotypeDropdownLogin data={data} key="autotype-dropdown" />] : undefined}
            {...itemViewProps}
        >
            {({ onHistory }) => (
                <>
                    {isMonitored(revision) && <ItemReport shareId={shareId} itemId={itemId} />}
                    <SecureLinkCardList shareId={shareId} itemId={itemId} />
                    <LoginContent revision={revision} />
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
