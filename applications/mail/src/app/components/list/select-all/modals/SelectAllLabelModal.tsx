import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import { Prompt } from '@proton/components';
import { useFolders, useLabels, useMessageCounts } from '@proton/components/hooks';
import { useConversationCounts } from '@proton/mail/counts/conversationCounts';
import clsx from '@proton/utils/clsx';

import { getLocationElementsCount } from 'proton-mail/helpers/elements';
import { getLabelNames } from 'proton-mail/helpers/labels';
import { isConversationMode } from 'proton-mail/helpers/mailSettings';
import useMailModel from 'proton-mail/hooks/useMailModel';

interface Props extends ModalProps {
    onResolve: () => void;
    onReject: () => void;
    isMessage: boolean;
    labelID: string;
    toLabel: string[];
    toUnlabel: string[];
    onCloseCustomAction?: () => void;
}

const SelectAllLabelModal = ({
    onResolve,
    onReject,
    isMessage,
    labelID,
    toLabel,
    toUnlabel,
    onCloseCustomAction,
    ...rest
}: Props) => {
    const mailSettings = useMailModel('MailSettings');
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
        return isMessage ? c('Title').t`Action all messages` : c('Title').t`Action all conversations`;
    };

    const getModalText = () => {
        let labelText;
        let unlabelText;

        const destinationNames = getLabelNames(toLabel, labels, folders) || [];
        const removedNames = getLabelNames(toUnlabel, labels, folders) || [];
        const isAddingLabels = destinationNames?.length > 0;
        const isRemovingLabels = removedNames?.length > 0;

        if (isMessage) {
            /* translator:
             * ${elementsCount} is the number of messages selected by the user
             * Full string for reference: "3 messages will be labelled as:"
             */
            labelText = c('Info').ngettext(
                msgid`${elementsCount} message will be labelled as:`,
                `${elementsCount} messages will be labelled as:`,
                elementsCount
            );

            /* translator:
             * ${elementsCount} is the number of messages selected by the user
             * Full string for reference: "3 messages will be unlabelled from:"
             */
            unlabelText = c('Info').ngettext(
                msgid`${elementsCount} message will be unlabelled from:`,
                `${elementsCount} messages will be unlabelled from:`,
                elementsCount
            );
        } else {
            /* translator:
             * ${elementsCount} is the number of conversations selected by the user
             * Full string for reference: "3 conversations will be labelled as:"
             */
            labelText = c('Info').ngettext(
                msgid`${elementsCount} conversation will be labelled as:`,
                `${elementsCount} conversations will be labelled as:`,
                elementsCount
            );

            /* translator:
             * ${elementsCount} is the number of conversations selected by the user
             * Full string for reference: "3 conversations will be unlabelled from:"
             */
            unlabelText = c('Info').ngettext(
                msgid`${elementsCount} conversation will be unlabelled from:`,
                `${elementsCount} conversations will be unlabelled from:`,
                elementsCount
            );
        }

        return (
            <>
                {isAddingLabels && (
                    <div>
                        <span>{labelText}</span>
                        <ul className="m-0">
                            {destinationNames.map((labelName) => {
                                return (
                                    <li key={labelName}>
                                        <span title={labelName} className="block max-w-full text-ellipsis">
                                            {labelName}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
                {isRemovingLabels && (
                    <div className={clsx(isAddingLabels && 'mt-2')}>
                        <span>{unlabelText}</span>
                        <ul className="m-0">
                            {removedNames.map((labelName) => {
                                return (
                                    <li key={labelName}>
                                        <span title={labelName} className="block max-w-full text-ellipsis">
                                            {labelName}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
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
                <Button color="norm" onClick={handleSubmit}>{c('Action').t`OK`}</Button>,
                <Button onClick={handleClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {getModalText()}
        </Prompt>
    );
};

export default SelectAllLabelModal;
