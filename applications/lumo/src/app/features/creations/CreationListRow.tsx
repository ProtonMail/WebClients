import { clsx } from 'clsx';
import { c } from 'ttag';

import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import { Dropdown, DropdownMenu, DropdownMenuButton } from '@proton/components';

import { ARTIFACT_TYPE_CONFIG } from '../../components/Conversation/artifact/artifactTypeConfig';
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
    const TypeIcon = ARTIFACT_TYPE_CONFIG[artifactType]?.icon ?? ARTIFACT_TYPE_CONFIG.document.icon;
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

    return (
        <div className="creations-row group relative flex items-center gap-3 min-w-0 rounded-lg px-2 py-1">
            <button
                type="button"
                className={clsx(
                    'creations-row-main flex flex-1 items-center gap-3 min-w-0 border-none bg-transparent text-left cursor-pointer rounded-lg py-2 px-1',
                    canOpen ? 'cursor-pointer' : 'cursor-default opacity-70'
                )}
                onClick={openInChat}
                disabled={!canOpen}
            >
                <span
                    className="creations-row-icon flex shrink-0 items-center justify-center rounded-lg bg-weak w-custom h-custom"
                    style={{ '--w-custom': '2.25rem', '--h-custom': '2.25rem' }}
                    aria-hidden
                >
                    <TypeIcon className="color-weak" size={4} />
                </span>
                <span className="flex flex-1 flex-column min-w-0 gap-0.5">
                    {title ? (
                        <span className="text-sm text-semibold color-norm text-ellipsis">{title}</span>
                    ) : (
                        <span className="creations-row-title-placeholder bg-weak rounded inline-block" aria-hidden />
                    )}
                    <span className="text-xs color-weak sm:hidden">{editedLabel}</span>
                </span>
                <span className="text-sm color-weak shrink-0 hidden sm:inline">{editedLabel}</span>
            </button>

            <button
                ref={anchorRef}
                type="button"
                className="creations-row-menu shrink-0 flex items-center justify-center border-none bg-transparent rounded p-1 cursor-pointer opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
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
        </div>
    );
};
