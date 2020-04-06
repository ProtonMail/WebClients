import React from 'react';
import { c, msgid } from 'ttag';

import { Toolbar, ToolbarButton, useNotifications } from 'react-components';

import useDrive from '../../../hooks/useDrive';
import useFileBrowser from '../../FileBrowser/useFileBrowser';
import useTrash from '../../../hooks/useTrash';
import { ResourceType } from '../../../interfaces/link';

interface Props {
    shareId?: string;
    fileBrowserControls: ReturnType<typeof useFileBrowser>;
}

const TrashToolbar = ({ shareId, fileBrowserControls }: Props) => {
    const { createNotification } = useNotifications();
    const { events } = useDrive();
    const { restoreLink, deleteLink } = useTrash();
    const { selectedItems } = fileBrowserControls;

    const handleAction = async (message: string, action: (shareId: string, linkId: string) => Promise<unknown>) => {
        const toTakeAction = selectedItems;
        const [{ Name: firstItemName }] = toTakeAction;

        if (shareId) {
            const results = await Promise.all(
                toTakeAction.map((item) =>
                    action(shareId, item.LinkID).then(
                        () => ({ state: 'resolved' }),
                        () => ({ state: 'rejected' })
                    )
                )
            );

            const resolvedCount = results.filter((p) => p.state === 'resolved').length;

            if (resolvedCount > 0) {
                const allFiles = toTakeAction.every(({ Type }) => Type === ResourceType.FILE);
                const allFolders = toTakeAction.every(({ Type }) => Type === ResourceType.FOLDER);
                const notificationTexts = {
                    allFiles: c('Notification').ngettext(
                        msgid`"${firstItemName}" ${message}`,
                        `${resolvedCount} files ${message}`,
                        resolvedCount
                    ),
                    allFolders: c('Notification').ngettext(
                        msgid`"${firstItemName}" ${message}`,
                        `${resolvedCount} folders ${message}`,
                        resolvedCount
                    ),
                    mixed: c('Notification').ngettext(
                        msgid`"${firstItemName}" ${message}`,
                        `${resolvedCount} items ${message}`,
                        resolvedCount
                    )
                };

                const notificationText =
                    (allFiles && notificationTexts.allFiles) ||
                    (allFolders && notificationTexts.allFolders) ||
                    notificationTexts.mixed;

                createNotification({ text: notificationText });
                await events.call(shareId);
            }
        }
    };

    const handleRestoreClick = async () => {
        handleAction('restored from Trash', restoreLink);
    };

    const handleDeleteClick = async () => {
        handleAction('deleted from Trash', deleteLink);
    };

    return (
        <Toolbar>
            {selectedItems.length > 0 && (
                <ToolbarButton title={c('Action').t`Restore`} icon="calendar-repeat" onClick={handleRestoreClick} />
            )}
            {
                <ToolbarButton
                    className="mlauto"
                    disabled={!selectedItems.length}
                    title={c('Action').t`Delete`}
                    onClick={handleDeleteClick}
                    icon="delete"
                />
            }
        </Toolbar>
    );
};

export default TrashToolbar;
