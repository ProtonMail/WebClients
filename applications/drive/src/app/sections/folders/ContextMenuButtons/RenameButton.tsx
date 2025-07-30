import { c } from 'ttag';

import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype';

import { useRenameModal } from '../../../components/modals/RenameModal';
import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { useActions } from '../../../store';

type Item = {
    isFile: boolean;
    mimeType: string;
    name: string;
    volumeId: string;
    linkId: string;
    rootShareId: string;
};

interface Props {
    item: Item;
    close: () => void;
}

export const RenameButton = ({ item, close }: Props) => {
    const { renameLink } = useActions();
    const [renameModal, showRenameModal] = useRenameModal();

    return (
        <>
            <ContextMenuButton
                name={c('Action').t`Rename`}
                icon="pen-square"
                testId="context-menu-rename"
                action={() =>
                    showRenameModal({
                        isFile: item.isFile,
                        isDoc: isProtonDocsDocument(item.mimeType),
                        name: item.name,
                        volumeId: item.volumeId,
                        linkId: item.linkId,
                        onSubmit: (formattedName) =>
                            renameLink(new AbortController().signal, item.rootShareId, item.linkId, formattedName),
                    })
                }
                close={close}
            />
            {renameModal}
        </>
    );
};
