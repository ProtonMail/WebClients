import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { FileIcon } from '@proton/components';

import type { ContextFilter } from '../../../../llm';
import { useLumoSelector } from '../../../../redux/hooks';
import { selectAttachments, selectContextFilters } from '../../../../redux/selectors';
import type { Attachment, Message } from '../../../../types';

export type FilesButtonProps = {
    messageChain: Message[];
    onClick: (filterMessage?: Message) => void;
    message?: Message; // Optional specific message to filter by
};

export const ReferenceFilesButton = ({ messageChain, onClick, message }: FilesButtonProps) => {
    const allAttachments = useLumoSelector(selectAttachments);
    const contextFilters = useLumoSelector(selectContextFilters);

    // Get unique attachment IDs from the current conversation (messageChain)
    const currentConversationAttachmentIds = new Set(
        messageChain.flatMap((msg) => [...(msg.attachments || []).map((att) => att.id), ...(msg.contextFiles || [])])
    );

    // Filter attachments to only include those from the current conversation
    const currentConversationAttachments = Object.fromEntries(
        Object.entries(allAttachments).filter(([id, _]) => currentConversationAttachmentIds.has(id))
    );

    // const uniqueAttachmentCount = new Set(Object.values(currentConversationAttachments).map(item => item.filename)).size;

    const isFileExcludedForNextMessage = (file: Attachment, messageId: string) => {
        const filter = contextFilters.find((f: ContextFilter) => f.messageId === messageId);
        return filter ? filter.excludedFiles.includes(file.filename) : false;
    };

    // Get files to display - use the attachments that were available at the time of this message
    const relevantFiles = message
        ? (() => {
              if (message.role === 'assistant' && message.contextFiles) {
                  // For assistant messages, show the files that were used in context
                  return message.contextFiles
                      .map((id) => currentConversationAttachments[id])
                      .filter((file): file is NonNullable<typeof file> => file !== null && file !== undefined);
              } else if (message.attachments) {
                  // For user messages, show the attachments that were attached to this message
                  return message.attachments
                      .map((attachment) => currentConversationAttachments[attachment.id])
                      .filter((file): file is NonNullable<typeof file> => file !== null && file !== undefined);
              }
              return [];
          })()
        : messageChain.flatMap((msg) => {
              if (!msg.attachments) return [];
              return msg.attachments
                  .map((attachment) => currentConversationAttachments[attachment.id])
                  .filter((file): file is NonNullable<typeof file> => file !== null && file !== undefined)
                  .filter((file) => !isFileExcludedForNextMessage(file, msg.id));
          });

    // Only show button if there are relevant files to display
    if (relevantFiles.length === 0) {
        return null;
    }

    // Get up to 3 unique file types for display
    const fileTypes = relevantFiles
        .map((file) => file.mimeType || 'unknown')
        .filter((type, index, arr) => arr.indexOf(type) === index)
        .slice(0, 3);

    const fileCount = relevantFiles.length;
    const label =
        fileCount === 1 ? c('collider_2025: Info').t`1 file` : `${fileCount} ${c('collider_2025: Info').t`files`}`;

    const handleClick = () => {
        onClick(message); // Pass the specific message when clicked
    };

    return (
        <Button
            className="flex flex-row flex-nowrap gap-2 items-center shrink-0 p-2 rounded"
            shape="outline"
            onClick={handleClick}
        >
            <div className="flex flex-row flex-nowrap">
                {fileTypes.map((mimeType, index) => (
                    <div
                        key={`${mimeType}-${index}`}
                        className="source-favicon rounded-full bg-norm border border-weak flex"
                        style={{ marginLeft: index > 0 ? '-4px' : '0' }}
                    >
                        <FileIcon mimeType={mimeType} size={4} className="rounded-full" />
                    </div>
                ))}
            </div>
            <span>{label}</span>
        </Button>
    );
};
