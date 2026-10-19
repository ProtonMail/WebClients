import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import type { DropdownSize } from '@proton/components/components/dropdown/utils';

import { ArtifactActionsDropdown } from '../../components/Conversation/artifact/ArtifactActionsDropdown';
import type {
    ArtifactMenuAction,
    ArtifactMenuFormatOption,
} from '../../components/Conversation/artifact/ArtifactActionsDropdown';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';

const MENU_SIZE: DropdownSize = { width: '16rem', maxHeight: '24rem' };

interface Props {
    title: string;
    downloadOptions: ArtifactMenuFormatOption[];
    saveToDriveOptions: ArtifactMenuFormatOption[];
    onOpenChat?: () => void;
    /** An export is running: file actions wait until it finishes. */
    actionsDisabled?: boolean;
}

/** A Library card's ⋯ menu: download, save to Drive and open the creation's chat. */
export const LibraryCreationMenu = ({
    title,
    downloadOptions,
    saveToDriveOptions,
    onOpenChat,
    actionsDisabled,
}: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const trailingActions: ArtifactMenuAction[] = onOpenChat
        ? [
              {
                  key: 'open-chat',
                  label: c('collider_2025:Action').t`Open chat`,
                  icon: 'MessageSquare',
                  onSelect: onOpenChat,
              },
          ]
        : [];
    // Nothing to offer until the asset has decrypted.
    const isEmpty = downloadOptions.length === 0 && saveToDriveOptions.length === 0 && trailingActions.length === 0;

    return (
        <>
            <Button
                ref={anchorRef}
                icon
                shape="ghost"
                color="weak"
                size="small"
                className="shrink-0"
                disabled={isEmpty}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                title={c('collider_2025:Action').t`More actions`}
                aria-label={c('collider_2025:Action').t`More actions for ${title}`}
                onClick={toggle}
            >
                <LumoIcon name="Ellipsis" size={16} />
            </Button>
            <ArtifactActionsDropdown
                anchorRef={anchorRef}
                isOpen={isOpen}
                onClose={close}
                size={MENU_SIZE}
                originalPlacement="bottom-end"
                downloadOptions={downloadOptions}
                saveToDriveOptions={saveToDriveOptions}
                trailingActions={trailingActions}
                actionsDisabled={actionsDisabled}
            />
        </>
    );
};
