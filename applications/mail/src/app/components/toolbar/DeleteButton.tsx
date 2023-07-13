import { c } from 'ttag';

import { Kbd } from '@proton/atoms';
import { Icon, ToolbarButton, useMailSettings } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { metaKey } from '@proton/shared/lib/helpers/browser';

interface Props {
    selectedIDs: string[];
    onDelete: () => Promise<void>;
}

const DeleteButton = ({ onDelete, selectedIDs = [] }: Props) => {
    const [loading, withLoading] = useLoading();
    const [{ Shortcuts = 0 } = {}] = useMailSettings();

    const titleDelete = Shortcuts ? (
        <>
            {c('Action').t`Delete permanently`}
            <br />
            <Kbd shortcut={metaKey} /> + <Kbd shortcut="Backspace" />
        </>
    ) : (
        c('Action').t`Delete permanently`
    );

    return (
        <ToolbarButton
            title={titleDelete}
            onClick={() => withLoading(onDelete())}
            disabled={loading || !selectedIDs.length}
            data-testid="toolbar:deletepermanently"
            icon={<Icon name="cross-circle" alt={c('Action').t`Delete permanently`} />}
        />
    );
};

export default DeleteButton;
