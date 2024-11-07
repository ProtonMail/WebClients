import { type FC } from 'react';

import { c, msgid } from 'ttag';

import { useBulkSelect } from '@proton/pass/components/Bulk/BulkSelectProvider';
import { type ConfirmationPromptHandles } from '@proton/pass/components/Confirmation/ConfirmationPrompt';
import { ConfirmAliasAction } from '@proton/pass/components/Item/Actions/ConfirmAliasAction';

export const ConfirmDeleteAliases: FC<ConfirmationPromptHandles> = (props) => {
    const { aliasCount } = useBulkSelect();

    return (
        <ConfirmAliasAction
            title={c('Title').ngettext(
                msgid`You’re about to permanently delete ${aliasCount} alias`,
                `You’re about to permanently delete ${aliasCount} aliases`,
                aliasCount
            )}
            message={c('Title').ngettext(
                msgid`Please note that once deleted, the alias can't be restored.`,
                `Please note that once once deleted, the aliases can't be restored.`,
                aliasCount
            )}
            remember={false}
            actionText={c('Action').ngettext(
                msgid`Understood, I will never need it`,
                `Understood, I will never need them`,
                aliasCount
            )}
            onClose={props.onCancel}
            onAction={props.onConfirm}
        />
    );
};
