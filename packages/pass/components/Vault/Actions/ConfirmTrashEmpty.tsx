import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { Alert } from '@proton/components';
import {
    ConfirmationPrompt,
    type ConfirmationPromptHandles,
} from '@proton/pass/components/Confirmation/ConfirmationPrompt';
import { selectTrashedAliasCount } from '@proton/pass/store/selectors';

export const ConfirmTrashEmpty: FC<ConfirmationPromptHandles> = ({ open, onCancel, onConfirm }) => {
    const aliasCount = useSelector(selectTrashedAliasCount);

    return (
        <ConfirmationPrompt
            danger
            onCancel={onCancel}
            onConfirm={onConfirm}
            open={open}
            title={c('Title').t`Permanently remove all items?`}
            confirmText={c('Action').t`Delete all`}
            message={
                <>
                    {aliasCount > 0 && (
                        <Alert className="mb-4" type="error">
                            {c('Title').ngettext(
                                msgid`You’re about to permanently delete ${aliasCount} alias`,
                                `You’re about to permanently delete ${aliasCount} aliases`,
                                aliasCount
                            )}
                            {'. '}
                            {c('Title').ngettext(
                                msgid`Please note that once deleted, the alias can't be restored.`,
                                `Please note that once once deleted, the aliases can't be restored.`,
                                aliasCount
                            )}
                        </Alert>
                    )}

                    <span>
                        {c('Warning')
                            .t`All your trashed items will be permanently deleted. You cannot undo this action.`}
                    </span>
                </>
            }
        />
    );
};
