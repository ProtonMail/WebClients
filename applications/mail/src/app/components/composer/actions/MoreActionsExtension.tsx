import { MutableRefObject, memo, useCallback } from 'react';

import { c } from 'ttag';

import { DropdownMenuButton, EditorMetadata, Icon, useAddresses, useUserSettings } from '@proton/components';
import { defaultFontStyle } from '@proton/components/components/editor/helpers';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import {
    isAttachPublicKey as testIsAttachPublicKey,
    isRequestReadReceipt as testIsRequestReadReceipt,
} from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';

import useMailModel from 'proton-mail/hooks/useMailModel';

import { exportPlainText, plainTextToHTML, setDocumentContent } from '../../../helpers/message/messageContent';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { MessageChange, MessageChangeFlag } from '../Composer';
import { ExternalEditorActions } from '../editor/EditorWrapper';

const { FLAG_PUBLIC_KEY, FLAG_RECEIPT_REQUEST } = MESSAGE_FLAGS;

const getClassname = (status: boolean) => (status ? undefined : 'visibility-hidden');

interface Props {
    message: MessageState | undefined;
    onChangeFlag: MessageChangeFlag;
    editorActionsRef: MutableRefObject<ExternalEditorActions | undefined>;
    editorMetadata: EditorMetadata;
    onChange: MessageChange;
}

const MoreActionsExtension = ({ message, onChangeFlag, editorActionsRef, editorMetadata, onChange }: Props) => {
    const mailSettings = useMailModel('MailSettings');
    const [addresses] = useAddresses();
    const [userSettings] = useUserSettings();

    const isAttachPublicKey = testIsAttachPublicKey(message?.data);
    const isReceiptRequest = testIsRequestReadReceipt(message?.data);

    const handleTogglePublicKey = async () => {
        const changes = new Map([[FLAG_PUBLIC_KEY, !isAttachPublicKey]]);
        onChangeFlag(changes);
    };

    const handleToggleReceiptRequest = () => onChangeFlag(new Map([[FLAG_RECEIPT_REQUEST, !isReceiptRequest]]));

    const handleChangeMetadata = useCallback(
        (change: Partial<EditorMetadata>) => {
            const switchToPlainText = () => {
                const plainText = exportPlainText(editorActionsRef.current?.getContent() || '');

                const messageImages = message?.messageImages ? { ...message.messageImages, images: [] } : undefined;
                onChange({ messageDocument: { plainText }, data: { MIMEType: MIME_TYPES.PLAINTEXT }, messageImages });
            };

            const switchToHTML = () => {
                const MIMEType = MIME_TYPES.DEFAULT;
                const content = plainTextToHTML(
                    message?.data,
                    message?.messageDocument?.plainText,
                    mailSettings,
                    userSettings,
                    addresses
                );

                const fontStyles = defaultFontStyle(mailSettings);
                const wrappedContent = `<div style="${fontStyles}">${content}</div>`;

                const document = setDocumentContent(message?.messageDocument?.document, wrappedContent);
                onChange({ messageDocument: { document }, data: { MIMEType } });
            };

            if (change.isPlainText !== undefined) {
                if (change.isPlainText) {
                    switchToPlainText();
                    editorMetadata.setBlockquoteExpanded?.(true);
                } else {
                    switchToHTML();
                }
            }
        },
        [onChange, message]
    );

    return (
        <>
            {editorMetadata.supportPlainText && [
                <DropdownMenuButton
                    key={3}
                    className="text-left flex flex-nowrap flex-align-items-center"
                    onClick={() => {
                        if (editorMetadata.isPlainText !== false) {
                            handleChangeMetadata({ isPlainText: false });
                        }
                    }}
                    data-testid="editor-to-html"
                >
                    <span className="my-auto flex-item-fluid pl-1">{c('Info').t`Normal`}</span>
                    <Icon name="checkmark" className={clsx(['ml-4', getClassname(!editorMetadata.isPlainText)])} />
                </DropdownMenuButton>,
                <DropdownMenuButton
                    key={4}
                    className="text-left flex flex-nowrap flex-align-items-center"
                    onClick={() => {
                        if (editorMetadata.isPlainText !== true) {
                            handleChangeMetadata({ isPlainText: true });
                        }
                    }}
                    data-testid="editor-to-plaintext"
                >
                    <span className="my-auto flex-item-fluid pl-1">{c('Info').t`Plain text`}</span>
                    <Icon name="checkmark" className={clsx(['ml-4', getClassname(editorMetadata.isPlainText)])} />
                </DropdownMenuButton>,
                <div className="dropdown-item-hr" key="hr-more-options" />,
            ]}
            <DropdownMenuButton
                className="text-left flex flex-nowrap flex-align-items-center"
                onClick={handleTogglePublicKey}
                data-testid="composer:attach-public-key-button"
            >
                <span className="my-auto flex-item-fluid pl-1">{c('Info').t`Attach public key`}</span>
                <Icon name="checkmark" className={clsx(['ml-4', getClassname(isAttachPublicKey)])} />
            </DropdownMenuButton>
            <DropdownMenuButton
                className="text-left flex flex-nowrap flex-align-items-center"
                onClick={handleToggleReceiptRequest}
                data-testid="composer:read-receipt-button"
            >
                <span className="my-auto flex-item-fluid pl-1">{c('Info').t`Request read receipt`}</span>
                <Icon name="checkmark" className={clsx(['ml-4', getClassname(isReceiptRequest)])} />
            </DropdownMenuButton>
        </>
    );
};

export default memo(MoreActionsExtension);
