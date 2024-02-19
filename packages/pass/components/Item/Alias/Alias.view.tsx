import { type FC, type MouseEvent, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { AliasContent } from '@proton/pass/components/Item/Alias/Alias.content';
import { ItemViewHistoryStats } from '@proton/pass/components/Item/History/ItemViewHistoryStats';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { MoreInfoDropdown } from '@proton/pass/components/Layout/Dropdown/MoreInfoDropdown';
import { ItemViewPanel } from '@proton/pass/components/Layout/Panel/ItemViewPanel';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getNewItemRoute } from '@proton/pass/components/Navigation/routing';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { isTrashed } from '@proton/pass/lib/items/item.predicates';
import { selectLoginItemByUsername } from '@proton/pass/store/selectors';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { getFormattedDateFromTimestamp } from '@proton/pass/utils/time/format';

export const AliasView: FC<ItemViewProps<'alias'>> = (itemViewProps) => {
    const { navigate } = useNavigation();

    const { revision, vault, handleHistoryClick } = itemViewProps;
    const { data: item, createTime, modifyTime, revision: revisionNumber, optimistic } = revision;
    const { name } = item.metadata;
    const { shareId } = vault;
    const aliasEmail = revision.aliasEmail!;
    const trashed = isTrashed(revision);

    const relatedLogin = useSelector(selectLoginItemByUsername(aliasEmail));
    const relatedLoginName = relatedLogin?.data.metadata.name ?? '';

    const [confirmTrash, setConfirmTrash] = useState(false);

    const createLoginFromAlias = (evt: MouseEvent) => {
        evt.stopPropagation();
        evt.preventDefault();

        navigate(getNewItemRoute('login'), {
            searchParams: { username: aliasEmail },
            filters: { selectedShareId: shareId },
        });
    };

    const handleMoveToTrashClick = useCallback(() => {
        if (!relatedLogin) return itemViewProps.handleMoveToTrashClick();
        return setConfirmTrash(true);
    }, [relatedLogin, itemViewProps.handleMoveToTrashClick]);

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
            handleMoveToTrashClick={handleMoveToTrashClick}
        >
            <AliasContent revision={revision} optimistic={optimistic} showCreateLogin={!trashed} />

            <ItemViewHistoryStats
                createTime={createTime}
                modifyTime={modifyTime}
                handleHistoryClick={handleHistoryClick}
            />

            <MoreInfoDropdown
                info={[
                    {
                        label: c('Label').t`Modified`,
                        values: [
                            c('Info').ngettext(
                                msgid`${revisionNumber} time`,
                                `${revisionNumber} times`,
                                revisionNumber
                            ),
                            getFormattedDateFromTimestamp(modifyTime),
                        ],
                    },
                    { label: c('Label').t`Created`, values: [getFormattedDateFromTimestamp(createTime)] },
                ]}
            />
            <ConfirmationModal
                open={confirmTrash}
                title={c('Warning').t`Trash alias ?`}
                alertText={c('Warning')
                    .t`Alias "${name}" is currently used in login item "${relatedLoginName}". You will also stop receiving emails sent to "${aliasEmail}"`}
                submitText={c('Action').t`Move to trash`}
                onClose={() => setConfirmTrash(false)}
                onSubmit={pipe(() => setConfirmTrash(false), itemViewProps.handleMoveToTrashClick)}
            />
        </ItemViewPanel>
    );
};
