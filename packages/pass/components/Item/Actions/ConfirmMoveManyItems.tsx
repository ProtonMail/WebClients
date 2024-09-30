import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import {
    ConfirmationPrompt,
    type ConfirmationPromptHandles,
} from '@proton/pass/components/Confirmation/ConfirmationPrompt';
import { WithVault } from '@proton/pass/components/Vault/WithVault';
import { selectSecureLinksByItems } from '@proton/pass/store/selectors';
import type { BulkSelectionDTO } from '@proton/pass/types';

type Props = ConfirmationPromptHandles & {
    selected: BulkSelectionDTO;
    shareId: string;
};

export const ConfirmMoveManyItems: FC<Props> = ({ open, selected, shareId, onCancel, onConfirm }) => {
    const hasLinks = Boolean(useSelector(selectSecureLinksByItems(selected)).length);
    const count = Object.values(selected).reduce((acc, items) => acc + Object.keys(items).length, 0);

    return (
        <WithVault shareId={shareId} onFallback={onCancel}>
            {({ content: { name: vaultName } }) => (
                <ConfirmationPrompt
                    open={open}
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                    title={c('Title').ngettext(
                        msgid`Move ${count} item to ${vaultName}`,
                        `Move ${count} items to ${vaultName}`,
                        count
                    )}
                    message={
                        hasLinks
                            ? c('Info').ngettext(
                                  msgid`Moving an item to another vault will erase its history and all secure links.`,
                                  `Moving items to another vault will erase their history and all secure links.`,
                                  count
                              )
                            : c('Info').ngettext(
                                  msgid`Moving an item to another vault will erase its history.`,
                                  `Moving items to another vault will erase their history.`,
                                  count
                              )
                    }
                />
            )}
        </WithVault>
    );
};
