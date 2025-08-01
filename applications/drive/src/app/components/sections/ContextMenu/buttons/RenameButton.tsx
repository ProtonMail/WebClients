import { c } from 'ttag';

import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype';

import { useActions } from '../../../../store';
import type { useRenameModal } from '../../../modals/RenameModal';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    link: {
        isFile: boolean;
        mimeType: string;
        name: string;
        volumeId: string;
        linkId: string;
        rootShareId: string;
    };
    showRenameModal: ReturnType<typeof useRenameModal>[1];
    close: () => void;
}

const RenameButton = ({ link, showRenameModal, close }: Props) => {
    const { renameLink } = useActions();
    return (
        <ContextMenuButton
            name={c('Action').t`Rename`}
            icon="pen-square"
            testId="context-menu-rename"
            action={() =>
                showRenameModal({
                    isFile: link.isFile,
                    isDoc: isProtonDocsDocument(link.mimeType),
                    name: link.name,
                    volumeId: link.volumeId,
                    linkId: link.linkId,
                    onSubmit: (formattedName) =>
                        renameLink(new AbortController().signal, link.rootShareId, link.linkId, formattedName),
                })
            }
            close={close}
        />
    );
};

export default RenameButton;
