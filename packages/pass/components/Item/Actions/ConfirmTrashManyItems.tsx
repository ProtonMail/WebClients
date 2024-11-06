import { type FC } from 'react';

import { c, msgid } from 'ttag';

import { useBulkSelect } from '@proton/pass/components/Bulk/BulkSelectProvider';
import {
    ConfirmationPrompt,
    type ConfirmationPromptHandles,
} from '@proton/pass/components/Confirmation/ConfirmationPrompt';

export const ConfirmTrashManyItems: FC<ConfirmationPromptHandles> = (props) => {
    const { aliasCount } = useBulkSelect();

    return (
        <ConfirmationPrompt
            {...props}
            title={c('Title').ngettext(
                msgid`You’re about to delete ${aliasCount} alias`,
                `You’re about to delete ${aliasCount} aliases`,
                aliasCount
            )}
            message={c('Title').ngettext(
                msgid`Please note once deleted, the alias can't be restored.`,
                `Please note once deleted, the aliases can't be restored.`,
                aliasCount
            )}
        />
    );
};
