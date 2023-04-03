import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { DecryptedLink, useActions } from '../../../../store';

interface Props {
    selectedLinks: DecryptedLink[];
}

const DeletePermanentlyButton = ({ selectedLinks }: Props) => {
    const { deletePermanently, confirmModal } = useActions();

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Delete permanently`}
                icon={<Icon name="cross-circle" />}
                onClick={() => deletePermanently(new AbortController().signal, selectedLinks)}
                data-testid="toolbar-delete"
            />
            {confirmModal}
        </>
    );
};

export default DeletePermanentlyButton;
