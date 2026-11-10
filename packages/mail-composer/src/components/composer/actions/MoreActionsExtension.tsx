import type { MutableRefObject } from 'react';
import { memo, useCallback } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import type { EditorMetadata } from '@proton/components/components/editor/interface';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import type { MessageState } from '@proton/mail-message/store/messages/messagesTypes';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import {
    isAttachPublicKey as testIsAttachPublicKey,
    isRequestReadReceipt as testIsRequestReadReceipt,
} from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';

import { getSwitchToHTMLChange } from '../../../helpers/composer/mimeTypeSwitch';
import { useComposerMessageHost } from '../../../host/composerMessageHost';
import type { MessageChange, MessageChangeFlag } from '../Composer';
import type { ExternalEditorActions } from '../editor/EditorWrapper';

const getClassname = (status: boolean) => (status ? undefined : 'visibility-hidden');

interface Props {
    message: MessageState | undefined;
    onChangeFlag: MessageChangeFlag;
    editorActionsRef: MutableRefObject<ExternalEditorActions | undefined>;
    editorMetadata: EditorMetadata;
    onChange: MessageChange;
    onSwitchToPlainText: (getEditorContent: () => string) => void;
}

const MoreActionsExtension = ({
    message,
    onChangeFlag,
    editorActionsRef,
    editorMetadata,
    onChange,
    onSwitchToPlainText,
}: Props) => {
    const { useMailSettings } = useComposerMessageHost();
    const [mailSettings] = useMailSettings();
    const [addresses] = useAddresses();
    const [userSettings] = useUserSettings();

    const isAttachPublicKey = testIsAttachPublicKey(message?.data);
    const isReceiptRequest = testIsRequestReadReceipt(message?.data);

    const handleTogglePublicKey = async () => {
        const changes = new Map([[MESSAGE_FLAGS.FLAG_PUBLIC_KEY, !isAttachPublicKey]]);
        onChangeFlag(changes);
    };

    const handleToggleReceiptRequest = () =>
        onChangeFlag(new Map([[MESSAGE_FLAGS.FLAG_RECEIPT_REQUEST, !isReceiptRequest]]));

    const handleChangeMetadata = useCallback(
        (change: Partial<EditorMetadata>) => {
            const switchToHTML = () => {
                onChange(getSwitchToHTMLChange(message, mailSettings, userSettings, addresses || []));
            };

            if (change.isPlainText !== undefined) {
                if (change.isPlainText) {
                    onSwitchToPlainText(() => editorActionsRef.current?.getContent() || '');
                } else {
                    switchToHTML();
                }
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-3A5CE2
        [onChange, message]
    );

    return (
        <>
            {editorMetadata.supportPlainText && [
                <DropdownMenuButton
                    key={3}
                    className="text-left flex flex-nowrap items-center"
                    aria-pressed={!editorMetadata.isPlainText}
                    onClick={() => {
                        if (editorMetadata.isPlainText !== false) {
                            handleChangeMetadata({ isPlainText: false });
                        }
                    }}
                    data-testid="editor-to-html"
                >
                    <span className="my-auto flex-1 pl-1">{c('Info').t`Normal`}</span>
                    <IcCheckmark className={clsx(['ml-4', getClassname(!editorMetadata.isPlainText)])} />
                </DropdownMenuButton>,
                <DropdownMenuButton
                    key={4}
                    className="text-left flex flex-nowrap items-center"
                    aria-pressed={editorMetadata.isPlainText}
                    onClick={() => {
                        if (editorMetadata.isPlainText !== true) {
                            handleChangeMetadata({ isPlainText: true });
                        }
                    }}
                    data-testid="editor-to-plaintext"
                >
                    <span className="my-auto flex-1 pl-1">{c('Info').t`Plain text`}</span>
                    <IcCheckmark className={clsx(['ml-4', getClassname(editorMetadata.isPlainText)])} />
                </DropdownMenuButton>,
                <div className="dropdown-item-hr" key="hr-more-options" />,
            ]}
            <DropdownMenuButton
                className="text-left flex flex-nowrap items-center"
                onClick={handleTogglePublicKey}
                data-testid="composer:attach-public-key-button"
                aria-pressed={isAttachPublicKey}
            >
                <span className="my-auto flex-1 pl-1">{c('Info').t`Attach public key`}</span>
                <IcCheckmark className={clsx(['ml-4', getClassname(isAttachPublicKey)])} />
            </DropdownMenuButton>
            <DropdownMenuButton
                className="text-left flex flex-nowrap items-center"
                onClick={handleToggleReceiptRequest}
                data-testid="composer:read-receipt-button"
                aria-pressed={isReceiptRequest}
            >
                <span className="my-auto flex-1 pl-1">{c('Info').t`Request read receipt`}</span>
                <IcCheckmark className={clsx(['ml-4', getClassname(isReceiptRequest)])} />
            </DropdownMenuButton>
        </>
    );
};

export default memo(MoreActionsExtension);
