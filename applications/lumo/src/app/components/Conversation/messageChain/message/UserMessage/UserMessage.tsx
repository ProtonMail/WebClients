import { useState } from 'react';

import type { Message, SiblingInfo } from 'applications/lumo/src/app/types';
import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Icon } from '@proton/components';

import type { HandleEditMessage } from '../../../../../hooks/useLumoActions';
import { useWebSearch } from '../../../../../providers/WebSearchProvider';
import { useLumoSelector } from '../../../../../redux/hooks';
import { selectAttachments } from '../../../../../redux/selectors';
import type { Attachment } from '../../../../../types';
import { sendMessageEditEvent } from '../../../../../util/telemetry';
import { AttachmentFileCard, FileContentModal } from '../../../../Files/Common';
import { LazyProgressiveMarkdownRenderer } from '../../../../LumoMarkdown/LazyMarkdownComponents';
import SiblingSelector from '../../../../SiblingSelector';
import useCollapsibleMessageContent from '../useCollapsibleMessageContent';
import MessageEditor from './MessageEditor';

import './UserMessage.scss';

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
                    <Icon name="pencil" alt={c('collider_2025:Button').t`Edit`} />
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
    // onOpenFiles?: (message: Message) => void;
}

const UserMessage = ({ message, messageContent, siblingInfo, handleEditMessage, newMessageRef }: UserMessageProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [fileToView, setFileToView] = useState<Attachment | null>(null);
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

    const handleEdit = () => {
        sendMessageEditEvent();
        setIsEditing(true);
    };

    const handleViewFile = (attachment: Attachment) => {
        setFileToView(attachment);
    };

    const handleCloseFileView = () => {
        setFileToView(null);
    };

    return (
        <div
            className={clsx(
                'user-msg-container markdown-rendering *:min-size-auto gap-2 rounded-xl bg-strong p-4 min-h-custom relative group-hover-opacity-container',
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
                        <LazyProgressiveMarkdownRenderer
                            content={messageContent || ''}
                            isStreaming={false}
                            message={message}
                        />
                    </div>
                </div>
            )}

            {/* Show manual attachments as cards (auto-retrieved files are not shown here) */}
            {hasAttachments && (!isCollapsed || isEditing) && (
                <div className={clsx('overflow-x-scroll flex-nowrap min-w-full max-w-full flex flex-row gap-3')}>
                    {manualAttachments.map((attachment) => (
                        <AttachmentFileCard
                            key={attachment.id}
                            attachment={attachment}
                            readonly
                            onView={handleViewFile}
                        />
                    ))}
                </div>
            )}

            {!isEditing && (
                <div
                    className="user-toolbar group-hover:opacity-100 flex *:min-size-auto flex-row flex-nowrap gap-1 absolute bottom-custom right-0 p-1 items-center"
                    style={{ '--bottom-custom': '-1rem' }}
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
            {fileToView && (
                <FileContentModal attachment={fileToView} onClose={handleCloseFileView} open={!!fileToView} />
            )}
        </div>
    );
};

export default UserMessage;
