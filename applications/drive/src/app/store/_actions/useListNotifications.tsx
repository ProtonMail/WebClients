import { c, msgid } from 'ttag';

import { NotificationButton, useNotifications } from '@proton/components';

import { useErrorHandler } from '../_utils';

type Item = { linkId: string; name?: string };

export default function useListNotifications() {
    const { createNotification } = useNotifications();
    const { showAggregatedErrorNotification } = useErrorHandler();

    const createSuccessMessage = (
        linkInfos: Item[],
        linkIds: string[],
        oneItemMessage: (name: string) => string,
        manyItemsMessage: (numberOfItems: number) => string,
        undoAction?: () => Promise<void>
    ) => {
        if (!linkIds.length) {
            return;
        }

        const firstItemName = linkInfos.find((link) => link.linkId === linkIds[0])?.name;
        const message =
            firstItemName && linkIds.length === 1 ? oneItemMessage(firstItemName) : manyItemsMessage(linkIds.length);

        createNotification({
            type: 'success',
            text: (
                <>
                    <span>{message}</span>
                    {undoAction && (
                        <>
                            <NotificationButton onClick={() => undoAction()}>{c('Action').t`Undo`}</NotificationButton>
                        </>
                    )}
                </>
            ),
        });
    };

    const createFailureMessage = (
        linkInfos: Item[],
        failures: { [linkId: string]: any },
        oneItemMessage: (name: string) => string,
        manyItemsMessage: (numberOfItems: number) => string
    ) => {
        showAggregatedErrorNotification(Object.values(failures), (errors) => {
            const firstItemId = Object.keys(failures)[0];

            const firstItemName = linkInfos.find((link) => link.linkId === firstItemId)?.name;
            return firstItemName && errors.length === 1
                ? oneItemMessage(firstItemName)
                : manyItemsMessage(errors.length);
        });
    };

    const createMovedItemsNotifications = (
        linkInfos: Item[],
        ok: string[],
        failures: { [linkId: string]: any },
        undoAction?: () => Promise<void>
    ) => {
        createSuccessMessage(
            linkInfos,
            ok,
            (name: string) => c('Notification').t`"${name}" successfully moved`,
            (numberOfItems: number) =>
                c('Notification').ngettext(
                    msgid`${numberOfItems} item successfully moved`,
                    `${numberOfItems} items successfully moved`,
                    numberOfItems
                ),
            undoAction
        );
        createFailureMessage(
            linkInfos,
            failures,
            (name: string) => c('Notification').t`"${name}" failed to be moved`,
            (numberOfItems: number) =>
                c('Notification').ngettext(
                    msgid`${numberOfItems} item failed to be moved`,
                    `${numberOfItems} items failed to be moved`,
                    numberOfItems
                )
        );
    };

    const createTrashedItemsNotifications = (
        linkInfos: Item[],
        ok: string[],
        failures: { [linkId: string]: any },
        undoAction?: () => Promise<void>
    ) => {
        createSuccessMessage(
            linkInfos,
            ok,
            (name: string) => c('Notification').t`"${name}" moved to trash`,
            (numberOfItems: number) =>
                c('Notification').ngettext(
                    msgid`${numberOfItems} item moved to trash`,
                    `${numberOfItems} items moved to trash`,
                    numberOfItems
                ),
            undoAction
        );
        createFailureMessage(
            linkInfos,
            failures,
            (name: string) => c('Notification').t`"${name}" failed to be moved to trash`,
            (numberOfItems: number) =>
                c('Notification').ngettext(
                    msgid`${numberOfItems} item failed to be moved to trash`,
                    `${numberOfItems} items failed to be moved to trash`,
                    numberOfItems
                )
        );
    };

    const createDeletedPublicItemsNotifications = (
        linkInfos: Item[],
        ok: string[],
        failures: { [linkId: string]: any }
    ) => {
        createSuccessMessage(
            linkInfos,
            ok,
            (name: string) => c('Notification').t`"${name}" deleted`,
            (numberOfItems: number) =>
                c('Notification').ngettext(
                    msgid`${numberOfItems} item deleted`,
                    `${numberOfItems} items deleted`,
                    numberOfItems
                )
        );
        createFailureMessage(
            linkInfos,
            failures,
            (name: string) => c('Notification').t`"${name}" failed to be deleted`,
            (numberOfItems: number) =>
                c('Notification').ngettext(
                    msgid`${numberOfItems} item failed to be deleted`,
                    `${numberOfItems} items failed to be deleted`,
                    numberOfItems
                )
        );
    };

    const createRestoredItemsNotifications = (
        linkInfos: Item[],
        ok: string[],
        failures: { [linkId: string]: any },
        undoAction?: () => Promise<void>
    ) => {
        createSuccessMessage(
            linkInfos,
            ok,
            (name: string) => c('Notification').t`"${name}" restored from trash`,
            (numberOfItems: number) =>
                c('Notification').ngettext(
                    msgid`${numberOfItems} item restored from trash`,
                    `${numberOfItems} items restored from trash`,
                    numberOfItems
                ),
            undoAction
        );

        createFailureMessage(
            linkInfos,
            failures,
            (name: string) => c('Notification').t`"${name}" failed to be restored from trash`,
            (numberOfItems: number) =>
                c('Notification').ngettext(
                    msgid`${numberOfItems} item failed to be restored from trash`,
                    `${numberOfItems} items failed to be restored from trash`,
                    numberOfItems
                )
        );
    };

    const createDeletedItemsNotifications = (linkInfos: Item[], ok: string[], failures: { [linkId: string]: any }) => {
        createSuccessMessage(
            linkInfos,
            ok,
            (name: string) => c('Notification').t`"${name}" deleted permanently from trash`,
            (numberOfItems: number) =>
                c('Notification').ngettext(
                    msgid`${numberOfItems} item deleted permanently from trash`,
                    `${numberOfItems} items deleted permanently from trash`,
                    numberOfItems
                )
        );
        createFailureMessage(
            linkInfos,
            failures,
            (name: string) => c('Notification').t`"${name}" failed to be deleted permanently from trash`,
            (numberOfItems: number) =>
                c('Notification').ngettext(
                    msgid`${numberOfItems} item failed to be deleted permanently from trash`,
                    `${numberOfItems} items failed to be deleted permanently from trash`,
                    numberOfItems
                )
        );
    };

    return {
        createMovedItemsNotifications,
        createTrashedItemsNotifications,
        createRestoredItemsNotifications,
        createDeletedItemsNotifications,
        createDeletedPublicItemsNotifications,
        createSuccessMessage,
        createFailureMessage,
    };
}
