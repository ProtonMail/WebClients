import { c, msgid } from 'ttag';

import { NotificationButton, useNotifications } from '@proton/components';

import { useErrorHandler } from '../_utils';
import type { LinkInfo } from './interface';

export default function useListNotifications() {
    const { createNotification } = useNotifications();
    const { showAggregatedErrorNotification } = useErrorHandler();

    const createSuccessMessage = (
        linkInfos: LinkInfo[],
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
        linkInfos: LinkInfo[],
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
        linkInfos: LinkInfo[],
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
        linkInfos: LinkInfo[],
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

    const createRestoredItemsNotifications = (
        linkInfos: LinkInfo[],
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

    const createDeletedItemsNotifications = (
        linkInfos: LinkInfo[],
        ok: string[],
        failures: { [linkId: string]: any }
    ) => {
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

    const createDeletedSharedLinksNotifications = (
        linkInfos: LinkInfo[],
        ok: string[],
        failures: { [linkId: string]: any }
    ) => {
        createSuccessMessage(
            linkInfos,
            ok,
            (name: string) => c('Notification').t`The link to "${name}" was deleted`,
            (numberOfItems: number) =>
                c('Notification').ngettext(
                    msgid`${numberOfItems} link to your item was deleted`,
                    `${numberOfItems} links to your items were deleted`,
                    numberOfItems
                )
        );
        createFailureMessage(
            linkInfos,
            failures,
            (name: string) => c('Notification').t`The link to "${name}" failed to be deleted`,
            (numberOfItems: number) =>
                c('Notification').ngettext(
                    msgid`${numberOfItems} link to your item failed to be deleted`,
                    `${numberOfItems} links to your items failed to be deleted`,
                    numberOfItems
                )
        );
    };

    return {
        createMovedItemsNotifications,
        createTrashedItemsNotifications,
        createRestoredItemsNotifications,
        createDeletedItemsNotifications,
        createDeletedSharedLinksNotifications,
    };
}
