import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import {
    Editor,
    EditorActions,
    EditorTextDirection,
    Icon,
    Tooltip,
    useModalState,
} from '@proton/components/components';
import { defaultFontStyle } from '@proton/components/components/editor/helpers';
import { useToolbar } from '@proton/components/components/editor/hooks/useToolbar';
import ToolbarEmojiDropdown from '@proton/components/components/editor/toolbar/ToolbarEmojiDropdown';
import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';
import { useTheme } from '@proton/components/containers';
import { classnames } from '@proton/components/helpers';
import { useAddresses, useMailSettings, useUserSettings } from '@proton/components/hooks';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import { DARK_THEMES } from '@proton/shared/lib/themes/themes';

import { MESSAGE_ACTIONS } from '../../../constants';
import { getFromAddress } from '../../../helpers/addresses';
import { insertSignature } from '../../../helpers/message/messageSignature';
import { toText } from '../../../helpers/parserHtml';
import { EditorTypes, useComposerContent } from '../../../hooks/composer/useComposerContent';
import { useGetConversation } from '../../../hooks/conversation/useConversation';
import { useGetAllMessages } from '../../../hooks/message/useMessage';
import { removeQuickReplyFlag } from '../../../logic/messages/draft/messagesDraftActions';
import { MessageState } from '../../../logic/messages/messagesTypes';
import DeleteQuickReplyModal from './DeleteQuickReplyModal';
import NoAttachmentsModal from './NoAttachmentsModal';
import QuickReplyType from './QuickReplyType';

import './QuickReply.scss';

interface Props {
    newMessageID: string;
    referenceMessage?: MessageState;
    onCloseQuickReply: () => void;
    conversationID?: string;
    onFocus: () => void;
    hasFocus: boolean;
    setHasFocus: Dispatch<SetStateAction<boolean>>;
}

const QuickReply = ({
    newMessageID,
    referenceMessage,
    onCloseQuickReply,
    conversationID,
    onFocus,
    hasFocus,
    setHasFocus,
}: Props) => {
    const [addresses] = useAddresses();
    const [mailSettings] = useMailSettings();
    const [userSettings] = useUserSettings();
    const dispatch = useDispatch();
    const quickReplyFrameRef = useRef<HTMLDivElement>(null);

    const getConversation = useGetConversation();
    const getAllMessages = useGetAllMessages();

    const [theme] = useTheme();
    const isDarkTheme = DARK_THEMES.includes(theme);

    const [deleteDraftModalProps, setDeleteDraftModalOpen, renderDeleteDraftModal] = useModalState();

    const [replyUpdated, setReplyUpdated] = useState(false);

    const [isEditorInitialized, setIsEditorInitialized] = useState(false);

    // Indicates that the composer is open but the edited message is not yet ready
    // Needed to prevent edition while data is not ready
    const [editorReady, setEditorReady] = useState(false);

    const editorRef = useRef<EditorActions>();
    const handleEditorReady = useCallback((editorActions: EditorActions) => {
        setEditorReady(true);
        editorRef.current = editorActions;
    }, []);

    const [attachmentsFoundKeyword, setAttachmentsFoundKeyword] = useState('');
    const [noAttachmentsModal, showAttachmentsModal] = useModalTwo(NoAttachmentsModal);

    const handleNoAttachments = async (keyword: string) => {
        setAttachmentsFoundKeyword(keyword);
        return showAttachmentsModal({
            attachmentsFoundKeyword: attachmentsFoundKeyword,
        });
    };

    const {
        syncedMessage,
        modelMessage,
        metadata,
        rightToLeft,
        isPlainText,
        isSending,
        opening,
        handleChange,
        handleChangeContent,
        handleDeleteDraft,
        handleDelete,
        senderVerificationModal,

        handleExpandComposer,
        handleSendQuickReply,
    } = useComposerContent({
        type: EditorTypes.quickReply,
        messageID: newMessageID,
        onClose: onCloseQuickReply,
        composerFrameRef: quickReplyFrameRef,
        referenceMessage,
        replyUpdated,
        setReplyUpdated,
        setDeleteDraftModalOpen,
        onNoAttachments: handleNoAttachments,
        editorRef,
        editorReady,
    });

    // Editor (Rooster) needs a white bg on dark themes, but not plaintext
    const needsDarkStyle = modelMessage.data?.MIMEType === MIME_TYPES.DEFAULT && isDarkTheme;

    /**
     * Initialize Rooster (or textarea) content at (and only) startup
     * Set content and RTL behavior
     */
    useEffect(() => {
        if (editorRef.current && syncedMessage.messageDocument?.initialized && mailSettings && !isEditorInitialized) {
            setIsEditorInitialized(true);

            const defaultAddress = getFromAddress(addresses, '', undefined);
            const fontStyle = defaultFontStyle(mailSettings);

            const signature = insertSignature(
                undefined,
                defaultAddress?.Signature,
                MESSAGE_ACTIONS.REPLY_ALL,
                mailSettings,
                userSettings,
                fontStyle
            );

            if (signature) {
                if (isPlainText) {
                    const plainSignature = toText(signature);
                    handleChangeContent(plainSignature, true, true);
                } else {
                    handleChangeContent(signature, true, true);
                }
            }

            if (rightToLeft === EditorTextDirection.RightToLeft) {
                editorRef.current?.setTextDirection?.(EditorTextDirection.RightToLeft);
            }

            setHasFocus(true);
        }
    }, [editorRef.current, syncedMessage.messageDocument, isPlainText]);

    // Prevent shortcuts from outside
    useEffect(() => {
        const quickReplyFrame = quickReplyFrameRef?.current;

        if (!quickReplyFrame) {
            return;
        }

        const handlePreventShortcuts = (e: KeyboardEvent) => {
            e.stopPropagation();
        };

        quickReplyFrame.addEventListener('keydown', handlePreventShortcuts);

        return () => {
            quickReplyFrame.removeEventListener('keydown', handlePreventShortcuts);
        };
    }, []);

    // Manage quick reply close when expanding
    // The composer will remove the draftFlag when opened, and we need to close the message afterwards
    useEffect(() => {
        if (!syncedMessage.draftFlags?.isQuickReply) {
            onCloseQuickReply?.();
        }
    }, [syncedMessage.draftFlags]);

    // If creating a new QR on the same conversation, close other QR which are not modified
    const closeUnmodifiedQuickReplies = () => {
        if (conversationID) {
            const conversation = getConversation(conversationID);
            const allMessages = getAllMessages();

            const conversationMessagesIDs = conversation?.Messages?.map((message) => message.ID) || [];

            // We also need to check that the quick reply draft is not being saved
            const quickReplyMessages =
                allMessages.filter((message) => message?.draftFlags?.isQuickReply && !message?.draftFlags?.isSaving) ||
                [];
            const quickReplyMessagesFromSameConversation = quickReplyMessages.filter((message) => {
                const isFromSameConversation = conversationMessagesIDs.includes(message?.draftFlags?.ParentID || '');
                const isCurrentMessage = message?.localID == newMessageID;
                const isAlreadySaved = message?.data?.ID;

                return isFromSameConversation && !isCurrentMessage && !isAlreadySaved;
            });

            quickReplyMessagesFromSameConversation.forEach((message) =>
                dispatch(removeQuickReplyFlag(message?.localID || ''))
            );
        }
    };

    // When opening a quick reply, check if the user has other opened.
    // If so and if they are not modified yet, we can close them since he might have opened them by mistake.
    useEffect(() => {
        closeUnmodifiedQuickReplies();
    }, []);

    const canRenderEditor = !!modelMessage.data?.MIMEType;

    const { openEmojiPickerRef, toolbarConfig, setToolbarConfig, modalLink, modalImage, modalDefaultFont } = useToolbar(
        {}
    );

    const handleBlurCallback = () => {
        setHasFocus(false);
    };
    const handleFocusCallback = () => {
        onFocus();
        setHasFocus(true);
    };

    const handleCloseQuickReply = async () => {
        onCloseQuickReply?.();
        await handleDelete();
    };

    return (
        <div ref={quickReplyFrameRef}>
            <div className="flex flex-nowrap flex-align-items-center mx1 mt1 mb0-5">
                <QuickReplyType
                    referenceMessage={referenceMessage}
                    modelMessage={modelMessage}
                    onChange={handleChange}
                    editorRef={editorRef}
                />
                <Tooltip title={c('Action').t`Open composer`}>
                    <Button
                        color="weak"
                        shape="ghost"
                        size="small"
                        icon
                        onClick={handleExpandComposer}
                        disabled={isSending}
                        className="mr0-5 flex-item-noshrink"
                    >
                        <Icon name="arrows-from-center" alt={c('Action').t`Open composer`} />
                    </Button>
                </Tooltip>
                <Tooltip title={c('Action').t`Close & discard`}>
                    <Button
                        color="weak"
                        shape="ghost"
                        size="small"
                        icon
                        onClick={handleDeleteDraft}
                        disabled={isSending}
                        className="flex-item-noshrink"
                    >
                        <Icon name="cross-big" alt={c('Action').t`Close & discard`} />
                    </Button>
                </Tooltip>
            </div>
            <div
                className={classnames([
                    'border border-weak quick-reply-container bg-norm relative field textarea rounded-lg flex flex-nowrap flex-column mx1 mb1',
                    hasFocus && 'is-focused',
                    needsDarkStyle && 'quick-reply-container-dark-style',
                ])}
                onBlur={handleBlurCallback}
                onFocus={handleFocusCallback}
                data-shortcut-target="quick-reply-container"
            >
                <div className="composer-body-container quick-reply-composer mb0-5">
                    {canRenderEditor && (
                        <Editor
                            onChange={handleChangeContent}
                            onReady={handleEditorReady}
                            metadata={metadata}
                            disabled={isSending || opening}
                            mailSettings={mailSettings}
                            isPlainText={isPlainText}
                            openEmojiPickerRef={openEmojiPickerRef}
                            toolbarConfig={toolbarConfig}
                            setToolbarConfig={setToolbarConfig}
                            modalLink={modalLink}
                            modalImage={modalImage}
                            modalDefaultFont={modalDefaultFont}
                            hasToolbar={false}
                            hasDropzone={false}
                            onFocus={handleFocusCallback}
                        />
                    )}
                </div>
                <div className="quick-reply-buttons absolute bottom right mb0-5 mr0-5 flex">
                    {toolbarConfig && !metadata.isPlainText && (
                        <ToolbarEmojiDropdown
                            className={classnames([
                                'button button-for-icon quick-reply-emoji-button ml0-25',
                                needsDarkStyle && 'quick-reply-emoji-button-dark-style',
                            ])}
                            onInsert={toolbarConfig.emoji.insert}
                            openRef={openEmojiPickerRef}
                        />
                    )}

                    <Tooltip title={c('Action').t`Send quick reply`}>
                        <Button
                            color="norm"
                            icon
                            disabled={!replyUpdated}
                            onClick={handleSendQuickReply}
                            loading={isSending}
                            className="ml0-5"
                        >
                            <Icon name="paper-plane" alt={c('Action').t`Send quick reply`} />
                        </Button>
                    </Tooltip>
                </div>
            </div>
            {renderDeleteDraftModal && (
                <DeleteQuickReplyModal onDeleteDraft={handleCloseQuickReply} {...deleteDraftModalProps} />
            )}
            {noAttachmentsModal}
            {senderVerificationModal}
        </div>
    );
};

export default QuickReply;
