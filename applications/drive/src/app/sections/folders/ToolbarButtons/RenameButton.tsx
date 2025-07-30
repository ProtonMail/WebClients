import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype';

import { useRenameModal } from '../../../components/modals/RenameModal';
import { isMultiSelect, noSelection } from '../../../components/sections/ToolbarButtons/utils';
import { useActions } from '../../../store';

type Item = {
    isFile: boolean;
    name: string;
    mimeType: string;
    volumeId: string;
    linkId: string;
    rootShareId: string;
};

type RenameButtonProps = {
    selectedItems: Item[];
};

export const RenameButton = ({ selectedItems }: RenameButtonProps) => {
    const [renameModal, showRenameModal] = useRenameModal();
    const { renameLink } = useActions(); // TODO:MODALS remove when old rename modal is phased out
    if (noSelection(selectedItems) || isMultiSelect(selectedItems)) {
        return null;
    }

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Rename`}
                icon={<Icon name="pen-square" alt={c('Action').t`Rename`} />}
                onClick={() =>
                    showRenameModal({
                        isFile: selectedItems[0].isFile,
                        name: selectedItems[0].name,
                        isDoc: isProtonDocsDocument(selectedItems[0].mimeType),
                        volumeId: selectedItems[0].volumeId,
                        linkId: selectedItems[0].linkId,
                        onSubmit: (formattedName) =>
                            renameLink(
                                new AbortController().signal,
                                selectedItems[0].rootShareId,
                                selectedItems[0].linkId,
                                formattedName
                            ),
                    })
                }
                data-testid="toolbar-rename"
            />
            {renameModal}
        </>
    );
};
