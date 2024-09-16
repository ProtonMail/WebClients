import { type FC, type MouseEvent, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { AliasContent } from '@proton/pass/components/Item/Alias/Alias.content';
import { AliasTrashConfirmModal } from '@proton/pass/components/Item/Alias/AliasTrashConfirm.modal';
import { ItemHistoryStats } from '@proton/pass/components/Item/History/ItemHistoryStats';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { MoreInfoDropdown } from '@proton/pass/components/Layout/Dropdown/MoreInfoDropdown';
import { ItemViewPanel } from '@proton/pass/components/Layout/Panel/ItemViewPanel';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getNewItemRoute } from '@proton/pass/components/Navigation/routing';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { getOccurrenceString } from '@proton/pass/lib/i18n/helpers';
import { isAliasDisabled, isTrashed } from '@proton/pass/lib/items/item.predicates';
import { aliasSyncStatusToggle } from '@proton/pass/store/actions';
import { selectLoginItemByEmail } from '@proton/pass/store/selectors';
import { OnboardingMessage } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { epochToDateTime } from '@proton/pass/utils/time/format';
import noop from '@proton/utils/noop';

export const AliasView: FC<ItemViewProps<'alias'>> = (itemViewProps) => {
    const { navigate } = useNavigation();
    const { onboardingCheck, onboardingAcknowledge } = usePassCore();
    const canToggleStatus = useFeatureFlag(PassFeature.PassSimpleLoginAliasesSync);

    const { revision, vault, handleHistoryClick } = itemViewProps;
    const { createTime, modifyTime, revision: revisionNumber, optimistic, itemId } = revision;
    const { shareId } = vault;
    const aliasEmail = revision.aliasEmail!;
    const trashed = isTrashed(revision);
    const aliasEnabled = !isAliasDisabled(revision);
    const modifiedCount = revisionNumber - 1;

    const relatedLogin = useSelector(selectLoginItemByEmail(aliasEmail));
    const relatedLoginName = relatedLogin?.data.metadata.name ?? '';

    const [confirmTrash, setConfirmTrash] = useState(false);
    const [canDisable, setCanDisable] = useState(aliasEnabled);

    const toggleStatus = useRequest(aliasSyncStatusToggle, {});

    const createLoginFromAlias = (evt: MouseEvent) => {
        evt.stopPropagation();
        evt.preventDefault();

        navigate(getNewItemRoute('login'), {
            searchParams: { email: aliasEmail },
            filters: { selectedShareId: shareId },
        });
    };

    const handleMoveToTrashClick = useCallback(() => {
        /* Show trash confirmation modal if:
        - alias is enabled and user didn't previously click "Don't remind me again"
        - or the alias is currently used in a login item */
        if (canDisable || relatedLogin) setConfirmTrash(true);
        else itemViewProps.handleMoveToTrashClick();
    }, [relatedLogin, itemViewProps.handleMoveToTrashClick, canDisable]);

    const handleConfirmDisableClick = (noRemind: boolean) => {
        setConfirmTrash(false);
        toggleStatus.dispatch({ shareId, itemId, enabled: false });
        if (noRemind) void onboardingAcknowledge?.(OnboardingMessage.ALIAS_TRASH_CONFIRM);
    };

    const handleConfirmTrashClick = (noRemind: boolean) => {
        setConfirmTrash(false);
        itemViewProps.handleMoveToTrashClick();
        if (noRemind) void onboardingAcknowledge?.(OnboardingMessage.ALIAS_TRASH_CONFIRM);
    };

    useEffect(() => {
        Promise.resolve(canToggleStatus && aliasEnabled && onboardingCheck?.(OnboardingMessage.ALIAS_TRASH_CONFIRM))
            .then((show) => setCanDisable(Boolean(show)))
            .catch(noop);
    }, [aliasEnabled, canToggleStatus]);

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

            <ItemHistoryStats createTime={createTime} modifyTime={modifyTime} handleHistoryClick={handleHistoryClick} />

            <MoreInfoDropdown
                info={[
                    { label: c('Label').t`Modified`, values: [getOccurrenceString(modifiedCount)] },
                    { label: c('Label').t`Created`, values: [epochToDateTime(createTime)] },
                ]}
            />

            {confirmTrash && (
                <AliasTrashConfirmModal
                    canDisable={canDisable}
                    onClose={() => setConfirmTrash(false)}
                    onDisable={handleConfirmDisableClick}
                    onTrash={handleConfirmTrashClick}
                    warning={
                        relatedLogin &&
                        c('Warning').t`This alias "${aliasEmail}" is currently used in the login "${relatedLoginName}".`
                    }
                />
            )}
        </ItemViewPanel>
    );
};
