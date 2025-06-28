import { c } from 'ttag';

import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype';

import usePublicToken from '../../../../hooks/drive/usePublicToken';
import { type DecryptedLink, usePublicActions } from '../../../../store';
import type { useRenameModal } from '../../../modals/RenameModal';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    link: DecryptedLink;
    showRenameModal: ReturnType<typeof useRenameModal>[1];
    close: () => void;
}

export const RenameButton = ({ link, showRenameModal, close }: Props) => {
    const { token } = usePublicToken();
    const { renameLink } = usePublicActions();
    return (
        <ContextMenuButton
            name={c('Action').t`Rename`}
            icon="pen-square"
            testId="context-menu-rename"
            action={() =>
                showRenameModal({
                    isFile: link.isFile,
                    name: link.name,
                    isDoc: isProtonDocsDocument(link.mimeType),
                    volumeId: link.volumeId,
                    linkId: link.linkId,
                    onSubmit: (formattedName) =>
                        renameLink(new AbortController().signal, {
                            token,
                            linkId: link.linkId,
                            parentLinkId: link.parentLinkId,
                            newName: formattedName,
                        }),
                })
            }
            close={close}
        />
    );
};
