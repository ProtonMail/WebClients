import { clsx } from 'clsx';
import { c } from 'ttag';

import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import { Dropdown, DropdownMenu, DropdownMenuButton } from '@proton/components';

import { ArtifactChipShell } from '../../components/Conversation/artifact/ArtifactChipShell';
import type { ArtifactType } from '../../components/Conversation/artifact/parseArtifacts';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { useLazyAttachment } from '../../hooks/useLazyAttachment';
import { useLumoNavigate } from '../../hooks/useLumoNavigate';
import type { AttachmentId } from '../../types';
import { getCreationDisplayTitle } from './creationDisplayTitle';
import { formatCreationEditedLabel } from './formatCreationEditedLabel';

interface CreationListRowProps {
    attachmentId: AttachmentId;
    editedAt: Date;
}

export const CreationListRow = ({ attachmentId, editedAt }: CreationListRowProps) => {
    const { data: attachment, isLoading } = useLazyAttachment(attachmentId);
    const navigate = useLumoNavigate();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const meta = attachment?.generatedArtifactAsset;
    const artifactType = (meta?.artifactType ?? 'document') as ArtifactType;
    const title = getCreationDisplayTitle(attachment?.filename, meta, isLoading);
    const editedLabel = formatCreationEditedLabel(editedAt);
    const canOpen = Boolean(meta?.conversationId && meta.artifactId);

    const openInChat = () => {
        if (!meta?.conversationId || !meta.artifactId) {
            return;
        }
        const params = new URLSearchParams({ artifact: meta.artifactId });
        navigate(`/c/${meta.conversationId}?${params.toString()}`);
    };

    const titleContent = title ? (
        title
    ) : (
        <span className="creations-row-title-placeholder bg-weak rounded inline-block" aria-hidden />
    );

    return (
        <ArtifactChipShell
            type={artifactType}
            className={clsx('creations-artifact-chip mt-2 mb-4', !canOpen && 'opacity-70')}
            title={titleContent}
            subtitle={<span className="text-xs color-weak sm:hidden">{editedLabel}</span>}
            trailing={<span className="text-sm color-weak shrink-0 hidden sm:inline">{editedLabel}</span>}
            onMainClick={openInChat}
            mainDisabled={!canOpen}
            actions={
                <>
                    <button
                        ref={anchorRef}
                        type="button"
                        className="shrink-0 flex items-center justify-center border-none bg-transparent rounded p-1 cursor-pointer"
                        aria-label={c('collider_2025:Action').t`More options`}
                        onClick={(event) => {
                            event.stopPropagation();
                            toggle();
                        }}
                    >
                        <LumoIcon name="EllipsisVertical" size={16} className="color-weak" />
                    </button>
                    <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} className="chat-dropdown-menu">
                        <DropdownMenu>
                            <DropdownMenuButton
                                className="text-left flex items-center gap-2"
                                disabled={!canOpen}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    close();
                                    openInChat();
                                }}
                            >
                                <LumoIcon name="ExternalLink" size={16} />
                                {c('collider_2025:Action').t`Open in chat`}
                            </DropdownMenuButton>
                        </DropdownMenu>
                    </Dropdown>
                </>
            }
        />
    );
};
