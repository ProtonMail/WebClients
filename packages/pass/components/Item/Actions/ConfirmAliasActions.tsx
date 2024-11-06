import type { FC } from 'react';
import { type ReactNode, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Alert, Checkbox, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { type ConfirmationPromptHandles } from '@proton/pass/components/Confirmation/ConfirmationPrompt';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { isAliasDisabled, isAliasItem } from '@proton/pass/lib/items/item.predicates';
import { aliasSyncStatusToggle } from '@proton/pass/store/actions';
import { selectLoginItemByEmail } from '@proton/pass/store/selectors';
import { type ItemRevision, SpotlightMessage } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';

type Props = {
    actionText: string;
    disableText?: string;
    message: ReactNode;
    remember: boolean;
    title: string;
    warning?: ReactNode;
    onAction: () => void;
    onClose: () => void;
    onDisable?: () => void;
};

const ConfirmAliasAction: FC<Props> = ({
    actionText,
    disableText,
    message,
    remember,
    title,
    warning,
    onAction,
    onClose,
    onDisable,
}) => {
    const { spotlight } = usePassCore();
    const [noRemind, setNoRemind] = useState(false);

    const withAcknowledge =
        (fn?: () => void) =>
        (noRemind: boolean): void => {
            fn?.();
            /** FIXME: ideally this should be moved away from spotlight
             * message state and be stored in the settings */
            if (noRemind) void spotlight.acknowledge(SpotlightMessage.ALIAS_TRASH_CONFIRM);
        };

    const doAction = withAcknowledge(onAction);
    const doDisable = withAcknowledge(onDisable);

    return (
        <PassModal onClose={onClose} onReset={onClose} enableCloseWhenClickOutside open size="small">
            <ModalTwoHeader title={title} closeButtonProps={{ pill: true }} />
            <ModalTwoContent>
                {warning && (
                    <Alert className="mb-4" type="error">
                        {warning}
                    </Alert>
                )}

                {message && <div>{message}</div>}
            </ModalTwoContent>
            <ModalTwoFooter className="flex flex-column items-stretch text-center">
                {remember && (
                    <Checkbox
                        className="pass-checkbox--unset gap-0 mb-4"
                        checked={noRemind}
                        onChange={({ target }) => setNoRemind(target.checked)}
                    >
                        {c('Label').t`Don't remind me again`}
                    </Checkbox>
                )}

                <Button color="danger" onClick={() => doAction(noRemind)} shape="solid" size="large" pill>
                    {actionText}
                </Button>

                {onDisable && (
                    <Button
                        color="norm"
                        onClick={pipe(() => doDisable(noRemind), onClose)}
                        shape="solid"
                        size="large"
                        pill
                    >
                        {disableText ?? c('Action').t`Disable alias`}
                    </Button>
                )}

                <Button onClick={onClose} size="large" shape="outline" color="norm" pill>
                    {c('Action').t`Cancel`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};

const useAliasActions = (item: ItemRevision) => {
    const dispatch = useDispatch();

    const { shareId, itemId } = item;
    const aliasEnabled = !isAliasDisabled(item);
    const aliasEmail = item.aliasEmail!;
    const relatedLogin = useSelector(selectLoginItemByEmail(aliasEmail));

    return useMemo(
        () => ({
            aliasEmail,
            aliasEnabled,
            relatedLogin,
            disableAlias: aliasEnabled
                ? () => dispatch(aliasSyncStatusToggle.intent({ shareId, itemId, enabled: false }))
                : undefined,
        }),
        [aliasEnabled, aliasEmail, relatedLogin]
    );
};

export const ConfirmTrashAlias: FC<ConfirmationPromptHandles & { item: ItemRevision }> = ({
    item,
    onCancel,
    onConfirm,
}) => {
    const { aliasEnabled, aliasEmail, relatedLogin, disableAlias } = useAliasActions(item);
    const relatedLoginName = relatedLogin?.data.metadata.name ?? '';

    return isAliasItem(item.data) ? (
        <ConfirmAliasAction
            title={c('Warning').t`Move to trash`}
            actionText={c('Action').t`Move to trash`}
            disableText={c('Action').t`Disable instead`}
            message={
                aliasEnabled &&
                c('Info')
                    .t`Aliases in trash will continue forwarding emails. If you want to stop receiving emails on this address, disable it instead.`
            }
            warning={
                relatedLogin &&
                c('Warning').t`This alias "${aliasEmail}" is currently used in the login "${relatedLoginName}".`
            }
            remember={aliasEnabled}
            onClose={onCancel}
            onDisable={disableAlias}
            onAction={onConfirm}
        />
    ) : null;
};

export const ConfirmDeleteAlias: FC<ConfirmationPromptHandles & { item: ItemRevision }> = ({
    item,
    onCancel,
    onConfirm,
}) => {
    const { aliasEnabled, aliasEmail, relatedLogin, disableAlias } = useAliasActions(item);
    const relatedLoginName = relatedLogin?.data.metadata.name ?? '';

    return isAliasItem(item.data) ? (
        <ConfirmAliasAction
            title={c('Warning').t`Delete alias`}
            actionText={c('Action').t`Delete it, I will never need it`}
            disableText={c('Action').t`Disable alias`}
            message={
                aliasEnabled
                    ? c('Info')
                          .t`Please note that once deleted, the alias can't be restored. Maybe you want to disable the alias instead?`
                    : c('Info')
                          .t`Please note that once deleted, the alias can't be restored. The alias is already disabled and won’t forward emails to your mailbox`
            }
            warning={
                relatedLogin &&
                c('Warning').t`This alias "${aliasEmail}" is currently used in the login "${relatedLoginName}".`
            }
            remember={false}
            onClose={onCancel}
            onDisable={disableAlias}
            onAction={onConfirm}
        />
    ) : null;
};
