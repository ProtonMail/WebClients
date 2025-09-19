import { type FC, useCallback, useMemo, useState } from 'react';

import { useLiveQuery } from 'dexie-react-hooks';
import { ItemEdit } from 'proton-authenticator/app/components/Items/ItemEdit';
import { ItemsGrid } from 'proton-authenticator/app/components/Items/ItemsGrid';
import { EmptyItemPlaceholder } from 'proton-authenticator/app/components/Layout/Placeholder/EmptyItemPlaceholder';
import { OTPOrchestrator } from 'proton-authenticator/app/components/Otp/OtpOrchestrator';
import { db } from 'proton-authenticator/lib/db/db';
import type { Item as DatabaseItem } from 'proton-authenticator/lib/db/entities/items';
import { formatItemName } from 'proton-authenticator/lib/entries/items';
import { itemSort } from 'proton-authenticator/lib/entries/ordering';
import { removeEntry, reorderEntry } from 'proton-authenticator/store/entries';
import { useAppDispatch } from 'proton-authenticator/store/utils';
import { c } from 'ttag';

import { ConfirmationPrompt } from '@proton/pass/components/Confirmation/ConfirmationPrompt';
import { useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import type { MaybeNull } from '@proton/pass/types';

type Props = {
    search: string;
    handleNewClick: () => void;
};

const getInitialModalState = () => ({ name: '', issuer: '' });

export const Items: FC<Props> = ({ search = '', handleNewClick }) => {
    const dispatch = useAppDispatch();
    const allItems = useLiveQuery(() => db.items.toArray(), [], undefined);

    const items = useMemo(() => {
        return (
            allItems
                ?.filter((entity): entity is DatabaseItem => {
                    if (!entity) return false;
                    const { name, issuer, syncMetadata } = entity;
                    const term = search.toLowerCase();
                    const match = !search || [name, issuer].some((field) => field.toLowerCase().includes(term));
                    const notTombstone = syncMetadata?.state !== 'PendingToDelete';

                    return match && notTombstone;
                })
                ?.sort(itemSort) ?? []
        );
    }, [allItems, search]);

    const searchHasNoResult = Boolean(search) && items.length === 0;
    const deleteCode = useAsyncModalHandles<void, { name: string; issuer: string }>({ getInitialModalState });
    const [editingItem, setEditingItem] = useState<MaybeNull<DatabaseItem>>(null);

    const onDelete = useCallback(
        (item: DatabaseItem) => {
            const { name, issuer } = item;
            return deleteCode.handler({ name, issuer, onSubmit: () => dispatch(removeEntry(item)) });
        },
        [deleteCode]
    );

    const onReorder = useCallback(
        (item: DatabaseItem, beforeItemId?: string, afterItemId?: string) =>
            dispatch(reorderEntry({ item, beforeItemId, afterItemId })),
        []
    );

    /** Database loading state */
    if (allItems === undefined) return;

    return items.length > 0 ? (
        <OTPOrchestrator>
            <ItemsGrid
                items={items}
                search={search}
                onDelete={onDelete}
                onEdit={setEditingItem}
                onReorder={onReorder}
            />
            {editingItem && <ItemEdit item={editingItem} onClose={() => setEditingItem(null)} />}
            {deleteCode.state.open && (
                <ConfirmationPrompt
                    danger
                    onCancel={deleteCode.abort}
                    onConfirm={deleteCode.resolver}
                    title={(() => {
                        const displayName = formatItemName(deleteCode.state);
                        return c('authenticator-2025:Title').t`Delete "${displayName}"`;
                    })()}
                    message={c('authenticator-2025:Label').t`Once deleted, this code cannot be recovered.`}
                    confirmText={c('authenticator-2025:Action').t`Confirm`}
                />
            )}
        </OTPOrchestrator>
    ) : (
        <EmptyItemPlaceholder handleNewClick={handleNewClick} searchHasNoResult={searchHasNoResult} />
    );
};
