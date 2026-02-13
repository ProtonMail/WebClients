import { useMemo } from 'react';

import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Icon, SidebarListItem } from '@proton/components';
import { isCustomFolder, isCustomLabel } from '@proton/mail/helpers/location';
import { useConversationCounts } from '@proton/mail/store/counts/conversationCountsSlice';
import { useMessageCounts } from '@proton/mail/store/counts/messageCountsSlice';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

interface Props {
    type: 'folders' | 'labels';
    onClick: () => void;
    title: string;
}

export const MailSidebarCollapsedButton = ({ type, onClick, title }: Props) => {
    const [mailSettings] = useMailSettings();

    const [labels] = useLabels();
    const [folders] = useFolders();

    const [messageCounts] = useMessageCounts();
    const [conversationCounts] = useConversationCounts();

    // We use the mail setting here as we want to know if any custom folder or label contain unread messages.
    // The logic is not tied to any labelID but rather on the state of the list of labels or folders.
    const isConversationMode = mailSettings.ViewMode === VIEW_MODE.GROUP;

    const unread = useMemo(() => {
        const mailboxCount = isConversationMode ? conversationCounts : messageCounts;

        return !!mailboxCount?.find((labelCount) => {
            if (!labelCount.LabelID) {
                return false;
            }

            if (type === 'folders' && isCustomFolder(labelCount.LabelID, folders)) {
                return labelCount?.Unread || 0 > 0;
            } else if (type === 'labels' && isCustomLabel(labelCount.LabelID, labels)) {
                return labelCount?.Unread || 0 > 0;
            }

            return false;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-007432
    }, [folders, labels, type, isConversationMode]);

    return (
        <SidebarListItem>
            <Tooltip originalPlacement="right" title={title}>
                <button
                    onClick={onClick}
                    className="flex items-center relative navigation-link-header-group-link mx-auto w-full"
                >
                    <Icon name={type === 'folders' ? 'folder' : 'tags'} alt={title} className="mx-auto" />
                    {unread && (
                        <span className="navigation-counter-item shrink-0">
                            <span className="sr-only">
                                {isConversationMode ? c('Info').t`Unread conversations` : c('Info').t`Unread messages`}
                            </span>
                        </span>
                    )}
                </button>
            </Tooltip>
        </SidebarListItem>
    );
};
