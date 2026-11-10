import type { FC } from 'react';

import { c, msgid } from 'ttag';

import { useMemoSelector } from '../../../hooks/useMemoSelector';
import { selectFolder, selectTopLevelFolders } from '../../../store/selectors/folders';
import { selectItemsInFolder } from '../../../store/selectors/items';
import { selectSecureLinksByShareId } from '../../../store/selectors/secure-links';
import type { MaybeNull } from '../../../types/utils';
import { ConfirmationPrompt, type ConfirmationPromptHandles } from '../../Confirmation/ConfirmationPrompt';
import { WithVault } from '../WithVault';

type Props = ConfirmationPromptHandles & {
    shareId: string;
    targetShareId: string;
    targetFolderId?: MaybeNull<string>;
};

export const ConfirmVaultMove: FC<Props> = ({ targetShareId, targetFolderId, shareId, onCancel, onConfirm }) => {
    const secureLinks = useMemoSelector(selectSecureLinksByShareId, [shareId]);
    const hasLinks = Boolean(secureLinks.length);
    const folders = useMemoSelector(selectTopLevelFolders, [shareId]);
    const rootItems = useMemoSelector(selectItemsInFolder, [shareId, null]);
    const targetFolder = useMemoSelector(selectFolder, [targetShareId, targetFolderId ?? '']);
    const count = rootItems.length;

    /** Moving to a folder of the same vault keeps history and secure links */
    const sameVault = targetShareId === shareId;

    return (
        <WithVault shareId={shareId} onFallback={onCancel}>
            {() => (
                <WithVault shareId={targetShareId} onFallback={onCancel}>
                    {({ content: { name: vaultName } }) => {
                        const target = targetFolder ? `${vaultName} > ${targetFolder.name}` : vaultName;

                        return (
                            <ConfirmationPrompt
                                onCancel={onCancel}
                                onConfirm={onConfirm}
                                title={c('Title').t`Move all items to "${target}"?`}
                                message={
                                    <div className="flex flex-column gap-y-2">
                                        {!sameVault && (
                                            <span>
                                                {c('Info')
                                                    .t`When moving items between vaults we will preserve up to the last 50 modifications performed to each item.`}
                                            </span>
                                        )}

                                        {!sameVault && hasLinks && (
                                            <span>
                                                {c('Info')
                                                    .t`Moving items to another vault will erase their secure links.`}
                                            </span>
                                        )}

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
                        );
                    }}
                </WithVault>
            )}
        </WithVault>
    );
};
