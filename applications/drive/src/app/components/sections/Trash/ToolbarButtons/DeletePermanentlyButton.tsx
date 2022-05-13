import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { DecryptedLink, useActions } from '../../../../store';

interface Props {
    shareId: string;
    selectedLinks: DecryptedLink[];
}

const DeletePermanentlyButton = ({ shareId, selectedLinks }: Props) => {
    const { deletePermanently } = useActions();

    return (
        <ToolbarButton
            title={c('Action').t`Delete permanently`}
            icon={<Icon name="cross-circle" />}
            onClick={() => deletePermanently(new AbortController().signal, shareId, selectedLinks)}
            data-testid="toolbar-delete"
        />
    );
};

export default DeletePermanentlyButton;
