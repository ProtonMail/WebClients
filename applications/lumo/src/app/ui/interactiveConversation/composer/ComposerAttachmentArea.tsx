import type { Attachment, AttachmentId, Message } from '../../../types';
import { ContextProgressIndicator, ContextSizeWarning } from '../../components/Context';
import { FileCard } from '../../components/Files';

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
            {/* Context Progress Indicator - shows usage percentage */}
            <ContextProgressIndicator attachments={allRelevantAttachments} messageChain={messageChain} />
            {/* Context Size Warning - only shows when needed */}
            <ContextSizeWarning
                attachments={allRelevantAttachments}
                messageChain={messageChain}
                onOpenFiles={onOpenFiles}
            />
            <div className="flex flex-row gap-3 px-2 overflow-x-auto py-2">
                {provisionalAttachments.map((attachment) => (
                    <FileCard
                        key={attachment.id}
                        attachment={attachment}
                        onRemove={() => onDeleteAttachment(attachment.id)}
                        onView={(attachment) => onViewFile(attachment)}
                    />
                ))}
            </div>
        </div>
    );
};
