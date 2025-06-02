import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype';

import type { DecryptedLink, useActions } from '../../../store';
import { useRenameModal } from '../../modals/RenameModal';
import { isMultiSelect, noSelection } from './utils';

interface RenameButtonProps {
    selectedLinks: DecryptedLink[];
    renameLink: ReturnType<typeof useActions>['renameLink'];
}

const RenameButton = ({ selectedLinks, renameLink }: RenameButtonProps) => {
    const [renameModal, showRenameModal] = useRenameModal();

    if (noSelection(selectedLinks) || isMultiSelect(selectedLinks)) {
        return null;
    }

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Rename`}
                icon={<Icon name="pen-square" alt={c('Action').t`Rename`} />}
                onClick={() =>
                    showRenameModal({
                        isFile: selectedLinks[0].isFile,
                        name: selectedLinks[0].name,
                        isDoc: isProtonDocsDocument(selectedLinks[0].mimeType),
                        onSubmit: (formattedName) =>
                            renameLink(
                                new AbortController().signal,
                                selectedLinks[0].rootShareId,
                                selectedLinks[0].linkId,
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

export default RenameButton;
