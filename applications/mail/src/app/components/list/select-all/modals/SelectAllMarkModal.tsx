import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button';
import type { ModalProps } from '@proton/components';
import { Prompt } from '@proton/components';
import { useConversationCounts, useMessageCounts } from '@proton/components/hooks';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import { getLocationElementsCount } from 'proton-mail/helpers/elements';
import { isConversationMode } from 'proton-mail/helpers/mailSettings';
import useMailModel from 'proton-mail/hooks/useMailModel';

interface Props extends ModalProps {
    onResolve: () => void;
    onReject: () => void;
    isMessage: boolean;
    markAction: MARK_AS_STATUS;
    labelID: string;
}
const SelectAllMarkModal = ({ onResolve, onReject, isMessage, markAction, labelID, ...rest }: Props) => {
    const mailSettings = useMailModel('MailSettings');
    const [conversationCounts] = useConversationCounts();
    const [messageCounts] = useMessageCounts();
    const isConversation = isConversationMode(labelID, mailSettings);
    const elementsCount = getLocationElementsCount(
        labelID,
        conversationCounts || [],
        messageCounts || [],
        isConversation
    );

    const markAsRead = markAction === MARK_AS_STATUS.READ;

    const getModalTitle = () => {
        if (markAsRead) {
            return isMessage ? c('Title').t`Mark messages as read` : c('Title').t`Mark conversations as read`;
        } else {
            return isMessage ? c('Title').t`Mark messages as unread` : c('Title').t`Mark conversations as unread`;
        }
    };

    const getModalText = () => {
        if (isMessage) {
            if (markAsRead) {
                /* translator:
                 * ${elementsCount} is the number of messages selected by the user
                 * Full string for reference: "3 messages will be marked as read"
                 */
                return c('Info').ngettext(
                    msgid`${elementsCount} message will be marked as read.`,
                    `${elementsCount} messages will be marked as read.`,
                    elementsCount
                );
            } else {
                /* translator:
                 * ${elementsCount} is the number of messages selected by the user
                 * Full string for reference: "3 messages will be marked as unread"
                 */
                return c('Info').ngettext(
                    msgid`${elementsCount} message will be marked as unread.`,
                    `${elementsCount} messages will be marked as unread.`,
                    elementsCount
                );
            }
        } else {
            if (markAsRead) {
                /* translator:
                 * ${elementsCount} is the number of conversations selected by the user
                 * Full string for reference: "3 conversations will be marked as read"
                 */
                return c('Info').ngettext(
                    msgid`${elementsCount} conversation will be marked as read.`,
                    `${elementsCount} conversations will be marked as read.`,
                    elementsCount
                );
            } else {
                /* translator:
                 * ${elementsCount} is the number of conversations selected by the user
                 * Full string for reference: "3 conversations will be marked as read"
                 */
                return c('Info').ngettext(
                    msgid`${elementsCount} conversation will be marked as unread.`,
                    `${elementsCount} conversations will be marked as unread.`,
                    elementsCount
                );
            }
        }
    };

    const handleSubmit = () => {
        onResolve();
        rest.onClose?.();
    };

    return (
        <Prompt
            title={getModalTitle()}
            buttons={[
                <Button color="norm" onClick={handleSubmit}>
                    {markAsRead ? c('Action').t`Mark as read` : c('Action').t`Mark as unread`}
                </Button>,
                <Button onClick={onReject}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {getModalText()}
        </Prompt>
    );
};

export default SelectAllMarkModal;
