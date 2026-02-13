import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components';
import { Prompt } from '@proton/components';
import { useConversationCounts } from '@proton/mail/store/counts/conversationCountsSlice';
import { useMessageCounts } from '@proton/mail/store/counts/messageCountsSlice';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

import { getLocationElementsCount } from 'proton-mail/helpers/elements';
import { isConversationMode } from 'proton-mail/helpers/mailSettings';

import { getLabelName } from '../../../../helpers/labels';

interface Props extends ModalProps {
    onResolve: () => void;
    onReject: () => void;
    isMessage: boolean;
    labelID: string;
    destinationID: string;
    onCloseCustomAction?: () => void;
}
const SelectAllMoveModal = ({
    onResolve,
    onReject,
    isMessage,
    labelID,
    destinationID,
    onCloseCustomAction,
    ...rest
}: Props) => {
    const [mailSettings] = useMailSettings();
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const [conversationCounts] = useConversationCounts();
    const [messageCounts] = useMessageCounts();
    const isConversation = isConversationMode(labelID, mailSettings);
    const elementsCount = getLocationElementsCount(
        labelID,
        conversationCounts || [],
        messageCounts || [],
        isConversation
    );

    const getModalTitle = () => {
        return isMessage ? c('Title').t`Move all messages` : c('Title').t`Move all conversations`;
    };

    const getModalText = () => {
        const scheduleAndSnoozeWarning = c('Info').t`Any scheduled or snoozed messages will be canceled.`;

        let sentenceBeginning;
        const destinationName = getLabelName(destinationID, labels, folders);
        const destinationElement = (
            <span
                className="inline-block max-w-full text-ellipsis align-bottom"
                key={destinationName}
                title={destinationName}
            >
                {destinationName}
            </span>
        );

        /* translator: Warning this is the end of a longer string.
         * We cannot put JSX in plural forms using ttag library, so we are forced to split the string in two parts
         * ${destinationName} is the folder selected by the user which messages or conversations will be moved
         * Full string for reference: "3 messages will be moved to Inbox folder." or "3 conversations will be moved to Inbox folder."
         */
        const sentenceEnd = c('Info').jt`to ${destinationElement} folder.`;

        if (isMessage) {
            /* translator: Warning this is the beginning of a longer string.
             * We cannot put JSX in plural forms using ttag library, so we are forced to split the string in two parts
             * ${elementsCount} is the number of messages selected by the user
             * Full string for reference: "3 messages will be moved to Inbox folder."
             */
            sentenceBeginning = c('Info').ngettext(
                msgid`${elementsCount} message will be moved`,
                `${elementsCount} messages will be moved`,
                elementsCount
            );
        } else {
            /* translator: Warning this is the beginning of a longer string.
             * We cannot put JSX in plural forms using ttag library, so we are forced to split the string in two parts
             * ${elementsCount} is the number of conversations selected by the user
             * Full string for reference: "3 conversations will be moved to Inbox folder."
             */
            sentenceBeginning = c('Info').ngettext(
                msgid`${elementsCount} conversation will be moved`,
                `${elementsCount} conversations will be moved`,
                elementsCount
            );
        }

        return (
            <>
                <div>
                    <span>{sentenceBeginning}</span>
                    <span className="ml-1">{sentenceEnd}</span>
                </div>
                <div>{scheduleAndSnoozeWarning}</div>
            </>
        );
    };

    const handleClose = () => {
        onCloseCustomAction?.();
        onReject();
    };

    const handleSubmit = () => {
        onResolve();
        rest.onClose?.();
    };

    return (
        <Prompt
            title={getModalTitle()}
            buttons={[
                <Button color="norm" onClick={handleSubmit} data-testid="select-all:move-modal-button">{c('Action')
                    .t`Move`}</Button>,
                <Button onClick={handleClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {getModalText()}
        </Prompt>
    );
};

export default SelectAllMoveModal;
