import type { FC, MouseEvent } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';

import { isTrashed } from '../../../lib/items/item.predicates';
import { FileAttachmentsContentView } from '../../FileAttachments/FileAttachmentsView';
import { DropdownMenuButton } from '../../Layout/Dropdown/DropdownMenuButton';
import { MoreInfoDropdown } from '../../Layout/Dropdown/MoreInfoDropdown';
import { ItemViewPanel } from '../../Layout/Panel/ItemViewPanel';
import { useNavigate } from '../../Navigation/NavigationActions';
import { getNewItemRoute } from '../../Navigation/routing';
import type { ItemViewProps } from '../../Views/types';
import { ItemHistoryStats } from '../History/ItemHistoryStats';
import { AliasContent } from './Alias.content';

export const AliasView: FC<ItemViewProps<'alias'>> = (itemViewProps) => {
    const navigate = useNavigate();
    const { revision, share } = itemViewProps;
    const { createTime, modifyTime, revision: revisionNumber, optimistic, itemId } = revision;
    const { shareId, vaultId } = share;
    const aliasEmail = revision.aliasEmail!;
    const trashed = isTrashed(revision);

    const createLoginFromAlias = (evt: MouseEvent) => {
        evt.stopPropagation();
        evt.preventDefault();

        navigate(getNewItemRoute('login'), {
            searchParams: { email: aliasEmail },
            filters: { selectedShareId: shareId },
        });
    };

    return (
        <ItemViewPanel
            type="alias"
            {...itemViewProps}
            {...(!trashed
                ? {
                      quickActions: [
                          <DropdownMenuButton
                              key="create-login"
                              onClick={createLoginFromAlias}
                              icon="user"
                              label={c('Action').t`Create login`}
                          />,
                      ],
                  }
                : {})}
        >
            {({ onHistory }) => (
                <>
                    <AliasContent
                        revision={revision}
                        optimistic={optimistic}
                        actions={
                            !trashed ? (
                                <InlineLinkButton className="text-underline" onClick={createLoginFromAlias}>
                                    {c('Action').t`Create login`}
                                </InlineLinkButton>
                            ) : null
                        }
                    />

                    <FileAttachmentsContentView revision={revision} />
                    <ItemHistoryStats createTime={createTime} modifyTime={modifyTime} handleHistoryClick={onHistory} />
                    <MoreInfoDropdown shareId={shareId} itemId={itemId} revision={revisionNumber} vaultId={vaultId} />
                </>
            )}
        </ItemViewPanel>
    );
};
