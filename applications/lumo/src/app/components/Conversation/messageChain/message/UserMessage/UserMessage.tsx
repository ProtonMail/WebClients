import { useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Icon } from '@proton/components';
import FileIcon from '@proton/components/components/fileIcon/FileIcon';
import { IcPencil } from '@proton/icons/icons/IcPencil';

import type { HandleEditMessage } from '../../../../../hooks/useLumoActions';
import { useWebSearch } from '../../../../../providers/WebSearchProvider';
import { useLumoSelector } from '../../../../../redux/hooks';
import { selectAttachments } from '../../../../../redux/selectors';
import type { Attachment, Message, SiblingInfo } from '../../../../../types';
import { getIsMobileDevice } from '../../../../../util/device';
import { parseFileReferences } from '../../../../../util/fileReferences';
import { getMimeTypeFromExtension } from '../../../../../util/filetypes';
import { sendMessageEditEvent } from '../../../../../util/telemetry';
import { AttachmentFileCard } from '../../../../Files/Common';
import { LazyProgressiveMarkdownRenderer } from '../../../../LumoMarkdown/LazyMarkdownComponents';
import SiblingSelector from '../../../../SiblingSelector';
import useCollapsibleMessageContent from '../useCollapsibleMessageContent';
import MessageEditor from './MessageEditor';

import './UserMessage.scss';

interface FileMentionChipProps {
    filename: string;
    attachment: Attachment | null;
    onView?: (attachment: Attachment) => void;
}

const FileMentionChip = ({ filename, attachment, onView }: FileMentionChipProps) => {
    const mimeType = getMimeTypeFromExtension(filename);
    const canPreview = Boolean(attachment && onView);

    const handleClick = () => {
        if (attachment && onView) {
            onView(attachment);
        }
    };

    const className =
        'inline-flex items-center gap-1 align-middle rounded border border-weak bg-weak px-2 py-0.5 text-sm transition-colors ' +
        (canPreview ? 'cursor-pointer hover:border-norm hover:bg-norm' : '');

    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <span className={className} title={filename} onClick={canPreview ? handleClick : undefined}>
            <FileIcon mimeType={mimeType} size={3} className="shrink-0" />
            <span className="max-w-48 overflow-hidden text-ellipsis whitespace-nowrap">{filename}</span>
        </span>
    );
};

interface MessageContentWithMentionsProps {
    content: string;
    message: Message;
    allAttachments: Record<string, Attachment>;
    onView: (attachment: Attachment) => void;
}

const MessageContentWithMentions = ({ content, message, allAttachments, onView }: MessageContentWithMentionsProps) => {
    const refs = parseFileReferences(content);
    if (refs.length === 0) {
        return <LazyProgressiveMarkdownRenderer content={content} isStreaming={false} message={message} />;
    }

    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;
    const sorted = [...refs].sort((a, b) => a.startIndex - b.startIndex);

    for (const ref of sorted) {
        if (ref.startIndex > lastIndex) {
            nodes.push(
                <span key={`text-${lastIndex}`} className="whitespace-pre-line">
                    {content.slice(lastIndex, ref.startIndex)}
                </span>
            );
        }

        // Find the attachment for this mention: prefer one already in this message's list,
        // fall back to any attachment with a matching filename in the Redux store.
        const fromMessage = (message.attachments || []).find(
            (a) => a.filename.toLowerCase() === ref.fileName.toLowerCase()
        );
        const attachment = fromMessage
            ? (allAttachments[fromMessage.id] ?? null)
            : (Object.values(allAttachments).find((a) => a.filename.toLowerCase() === ref.fileName.toLowerCase()) ??
              null);

        nodes.push(
            <FileMentionChip
                key={`mention-${ref.startIndex}`}
                filename={ref.fileName}
                attachment={attachment}
                onView={onView}
            />
        );
        lastIndex = ref.endIndex;
    }

    if (lastIndex < content.length) {
        nodes.push(
            <span key={`text-${lastIndex}`} className="whitespace-pre-line">
                {content.slice(lastIndex)}
            </span>
        );
    }

    return <>{nodes}</>;
};

interface UserActionToolbarProps {
    onEdit: () => void;
    onToggleCollapse: () => void;
    isCollapsed: boolean;
    canBeCollapsed: boolean;
}
const UserActionToolbar = ({ onEdit, onToggleCollapse, isCollapsed, canBeCollapsed }: UserActionToolbarProps) => {
    return (
        <div className="flex flex-row flex-nowrap gap-px p-0.5" style={{ inlineSize: 'max-content' }}>
            <Tooltip title={c('collider_2025:Button').t`Edit`} originalPlacement="top">
                <Button icon shape="ghost" className="shrink-0" onClick={onEdit} size="small">
                    <IcPencil alt={c('collider_2025:Button').t`Edit`} />
                </Button>
            </Tooltip>
            {canBeCollapsed && (
                <Tooltip
                    title={isCollapsed ? c('collider_2025:Button').t`Expand` : c('collider_2025').t`Collapse`}
                    originalPlacement="top"
                >
                    <Button
                        icon
                        shape="ghost"
                        color="weak"
                        className="shrink-0"
                        onClick={onToggleCollapse}
                        size="small"
                    >
                        <Icon name={isCollapsed ? 'chevron-down' : 'chevron-up'} />
                    </Button>
                </Tooltip>
            )}
        </div>
    );
};

interface UserMessageProps {
    message: Message;
    messageContent: string | undefined;
    siblingInfo: SiblingInfo;
    handleEditMessage: HandleEditMessage;
    newMessageRef?: React.MutableRefObject<HTMLDivElement | null>;
    onOpenFilePreview?: (attachment: Attachment) => void;
}

const UserMessage = ({ message, messageContent, siblingInfo, handleEditMessage, newMessageRef, onOpenFilePreview }: UserMessageProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const { isWebSearchButtonToggled } = useWebSearch();

    // Get full attachment data from Redux (shallow attachments in message only contain ID and basic metadata)
    const allAttachments = useLumoSelector(selectAttachments);

    // Only show manually uploaded attachments to THIS message
    // Exclude auto-retrieved files (both Drive files and project files retrieved via RAG)
    // We check BOTH the shallow attachment (from message) AND full attachment (from Redux)
    // because the autoRetrieved flag may only exist on the shallow attachment
    const manualAttachments = (message.attachments || [])
        .map((shallowAttachment) => {
            const fullAttachment = allAttachments[shallowAttachment.id];
            // Check autoRetrieved on both shallow and full attachment
            const isAutoRetrieved = shallowAttachment.autoRetrieved || fullAttachment?.autoRetrieved;

            if (isAutoRetrieved) {
                return null; // Exclude auto-retrieved files (Drive or project files)
            }

            // Exclude assistant-generated attachments
            if (fullAttachment?.role === 'assistant') {
                return null;
            }

            return fullAttachment || null;
        })
        .filter(Boolean) as Attachment[];

    const hasAttachments = manualAttachments.length > 0;

    const { contentRef, isCollapsed, showCollapseButton, toggleCollapse } = useCollapsibleMessageContent(message);
    const canBeCollapsed = showCollapseButton || hasAttachments;

    const hasSiblingInfo = siblingInfo.count > 1;
    const isMobile = getIsMobileDevice();

    const handleEdit = () => {
        sendMessageEditEvent();
        setIsEditing(true);
    };

    return (
        <div className="flex flex-column flex-nowrap gap-2">
            {hasAttachments && (!isCollapsed || isEditing) && (
                <div className={clsx('overflow-x-scroll flex-nowrap min-w-full max-w-full flex flex-row gap-3')}>
                    {manualAttachments.map((attachment) => (
                        <AttachmentFileCard
                            key={attachment.id}
                            attachment={attachment}
                            readonly
                            onView={onOpenFilePreview}
                        />
                    ))}
                </div>
            )}
            <div
                className={clsx(
                    'user-msg-container group-hover-opacity-container *:min-size-auto gap-2 rounded-xl p-4 min-h-custom relative',
                    !isEditing && 'markdown-rendering',
                    isEditing && 'w-full'
                )}
                style={{ '--min-h-custom': '3.25rem' /*52px*/ }} //to prevent the size change when buttons are shown on hover
                ref={newMessageRef}
            >
                {isEditing ? (
                    <MessageEditor
                        messageContent={messageContent || ''}
                        handleEditMessage={(newContent) => {
                            void handleEditMessage(message, newContent, isWebSearchButtonToggled);
                            setIsEditing(false);
                        }}
                        handleCancel={() => setIsEditing(false)}
                    />
                ) : (
                    <div className="test-container flex *:min-size-auto flex-1 flex-row flex-nowrap gap-2 justify-space-between items-center">
                        <div
                            className={clsx(
                                'lumo-markdown w-full max-w-full flex-1 text-pre-line',
                                isCollapsed && 'line-clamp-1'
                            )}
                            ref={contentRef}
                        >
                            <MessageContentWithMentions
                                content={messageContent || ''}
                                    message={message}
                                allAttachments={allAttachments}
                            onView={handleViewFile}
                        />
                        </div>
                    </div>
                )}

                {!isEditing && (
                    <div
                        className={clsx(
                            "user-toolbar flex *:min-size-auto flex-row flex-nowrap gap-1 absolute bottom-custom right-0 p-1 items-center",
                            !isMobile && 'group-hover:opacity-100'
                        )}
                        style={{ '--bottom-custom': '-1.5rem' }}
                    >
                        <div className=" bg-norm border border-weak rounded-lg">
                            <UserActionToolbar
                                onEdit={handleEdit}
                                onToggleCollapse={toggleCollapse}
                                isCollapsed={isCollapsed}
                                canBeCollapsed={canBeCollapsed}
                            />
                        </div>
                        {hasSiblingInfo && (
                            <div className="bg-norm rounded-lg border border-weak">
                                <SiblingSelector siblingInfo={siblingInfo} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserMessage;
