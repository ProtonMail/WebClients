import type { Attachment, AttachmentId, Message } from '../../types';
import { ContextProgressIndicator, ContextSizeWarning } from '../Context';
import { AttachmentFileCard } from '../Files/Common/AttachmentFileCard';

export interface ComposerAttachmentAreaProps {
    provisionalAttachments: Attachment[];
    allRelevantAttachments: Attachment[];
    messageChain: Message[];
    spaceId?: string;
    onDeleteAttachment: (id: AttachmentId) => void;
    onViewFile: (attachment: Attachment) => void;
    onOpenFiles?: () => void;
}

export const ComposerAttachmentArea = ({
    provisionalAttachments,
    allRelevantAttachments,
    messageChain,
    spaceId,
    onDeleteAttachment,
    onViewFile,
    onOpenFiles,
}: ComposerAttachmentAreaProps) => {
    return (
        <div className="attachments w-full flex flex-column flex-nowrap">
            <ContextProgressIndicator
                attachments={allRelevantAttachments}
                messageChain={messageChain}
                spaceId={spaceId}
            />
            <ContextSizeWarning
                attachments={allRelevantAttachments}
                messageChain={messageChain}
                spaceId={spaceId}
                onOpenFiles={onOpenFiles}
            />
            <div className="flex flex-row flex-nowrap gap-3 px-2 overflow-x-auto py-2">
                {provisionalAttachments.map((attachment) => (
                    <AttachmentFileCard
                        key={attachment.id}
                        attachment={attachment}
                        onRemove={() => onDeleteAttachment(attachment.id)}
                        onView={onViewFile}
                        className="shrink-0"
                    />
                ))}
            </div>
        </div>
    );
};
