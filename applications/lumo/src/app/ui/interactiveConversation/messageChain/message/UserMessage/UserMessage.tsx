import { useState } from 'react';

import type { Message, SiblingInfo } from 'applications/lumo/src/app/types';
import clsx from 'clsx';
import { c } from 'ttag';

import { Button, Tooltip } from '@proton/atoms';
import { Icon } from '@proton/components';

import type { HandleEditMessage } from '../../../../../hooks/useLumoActions';
import { useLumoSelector } from '../../../../../redux/hooks';
import { selectAttachments } from '../../../../../redux/selectors';
import { sendMessageEditEvent } from '../../../../../util/telemetry';
import { FileCard, FileContentModal } from '../../../../components/Files';
import LumoMarkdown from '../../../../components/LumoMarkdown/LumoMarkdown';
import SiblingSelector from '../../../../components/SiblingSelector';
import useCollapsibleMessageContent from '../useCollapsibleMessageContent';
import MessageEditor from './MessageEditor';
import type { Attachment } from '../../../../../types';

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
}

const UserMessage = ({ message, messageContent, siblingInfo, handleEditMessage, newMessageRef }: UserMessageProps) => {
    const hasAttachments = (message.attachments ?? []).length > 0;
    const [isEditing, setIsEditing] = useState(false);
    const [fileToView, setFileToView] = useState<Attachment | null>(null);

    // Get full attachment data from Redux (shallow attachments in message only contain ID and basic metadata)
    const allAttachments = useLumoSelector(selectAttachments);
    const fullAttachments = message.attachments?.map(shallowAttachment => 
        allAttachments[shallowAttachment.id]
    ).filter(Boolean) || [];

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
                'user-msg-container markdown-rendering flex *:min-size-auto flex-column gap-2 rounded-xl bg-strong p-4 min-h-custom relative group-hover-opacity-container',
                isEditing && 'w-full'
            )}
            style={{ '--min-h-custom': '3.25rem' /*52px*/ }} //to prevent the size change when buttons are shown on hover
            ref={newMessageRef}
        >
            {isEditing ? (
                <MessageEditor
                    messageContent={messageContent || ''}
                    handleEditMessage={(newContent) => {
                        handleEditMessage(message, newContent, false);
                        setIsEditing(false);
                    }}
                    handleCancel={() => setIsEditing(false)}
                />
            ) : (
                <div className="flex *:min-size-auto flex-1 flex-row flex-nowrap gap-2 justify-space-between items-center">
                    <div
                        className={clsx(
                            'lumo-markdown w-full max-w-full flex-1 text-pre-line',
                            isCollapsed && 'line-clamp-1'
                        )}
                        ref={contentRef}
                    >
                        <LumoMarkdown message={message} content={messageContent} />
                    </div>
                </div>
            )}

            {hasAttachments && (!isCollapsed || isEditing) && (
                <div className={clsx('overflow-x-scroll flex-nowrap min-w-full max-w-full flex flex-row gap-3')}>
                    {fullAttachments.map((attachment) => (
                        <FileCard key={attachment.id} attachment={attachment} readonly onView={handleViewFile} />
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
