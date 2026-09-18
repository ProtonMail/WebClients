import type { FC } from 'react';

import { c, msgid } from 'ttag';

import { useMemoSelector } from '../../../hooks/useMemoSelector';
import { selectItemsInFolder, selectSecureLinksByShareId, selectTopLevelFolders } from '../../../store/selectors';
import { ConfirmationPrompt, type ConfirmationPromptHandles } from '../../Confirmation/ConfirmationPrompt';
import { WithVault } from '../WithVault';

type Props = ConfirmationPromptHandles & { targetShareId: string; shareId: string };

export const ConfirmVaultMove: FC<Props> = ({ targetShareId, shareId, onCancel, onConfirm }) => {
    const secureLinks = useMemoSelector(selectSecureLinksByShareId, [shareId]);
    const hasLinks = Boolean(secureLinks.length);
    const folders = useMemoSelector(selectTopLevelFolders, [shareId]);
    const rootItems = useMemoSelector(selectItemsInFolder, [shareId, null]);
    const count = rootItems.length;

    return (
        <WithVault shareId={targetShareId} onFallback={onCancel}>
            {({ content: { name: vaultName } }) => (
                <ConfirmationPrompt
                    onCancel={onCancel}
                    onConfirm={onConfirm}
                    title={c('Title').t`Move all items to "${vaultName}"?`}
                    message={
                        <div className="flex flex-column gap-y-2">
                            <span>
                                {hasLinks
                                    ? c('Info')
                                          .t`Moving items to another vault will erase their history and all secure links.`
                                    : c('Info').t`Moving items to another vault will erase their history.`}
                            </span>

                            {folders.length > 0 && (
                                <span>
                                    {c('Info').ngettext(
                                        msgid`Only ${count} item will be moved. Items in folders will not be moved.`,
                                        `Only ${count} items will be moved. Items in folders will not be moved.`,
                                        count
                                    )}
                                </span>
                            )}
                        </div>
                    }
                />
            )}
        </WithVault>
    );
};
