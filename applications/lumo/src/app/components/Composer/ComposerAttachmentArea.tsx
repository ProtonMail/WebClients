import type { Attachment, AttachmentId, Message } from '../../types';
import { ContextProgressIndicator, ContextSizeWarning } from '../Context';
import { AttachmentFileCard } from '../Files/Common/AttachmentFileCard';

export interface ComposerAttachmentAreaProps {
    provisionalAttachments: Attachment[];
    allRelevantAttachments: Attachment[];
    messageChain: Message[];
    onDeleteAttachment: (id: AttachmentId) => void;
    onViewFile: (attachment: Attachment) => void;
    onOpenFiles?: () => void;
}

export const ComposerAttachmentArea = ({
    provisionalAttachments,
    allRelevantAttachments,
    messageChain,
    onDeleteAttachment,
    onViewFile,
    onOpenFiles,
}: ComposerAttachmentAreaProps) => {
    return (
        <div className="attachments w-full flex flex-column flex-nowrap">
            <ContextProgressIndicator attachments={allRelevantAttachments} messageChain={messageChain} />
            <ContextSizeWarning
                attachments={allRelevantAttachments}
                messageChain={messageChain}
                onOpenFiles={onOpenFiles}
            />
            <div className="flex flex-row gap-3 px-2 overflow-x-auto py-2">
                {provisionalAttachments.map((attachment) => (
                    <AttachmentFileCard
                        key={attachment.id}
                        attachment={attachment}
                        onRemove={() => onDeleteAttachment(attachment.id)}
                        onView={onViewFile}
                    />
                ))}
            </div>
        </div>
    );
};
