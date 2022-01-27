import { Icon, useLoading, useMailSettings, ToolbarButton } from '@proton/components';
import { metaKey } from '@proton/shared/lib/helpers/browser';
import { c } from 'ttag';

import { usePermanentDelete } from '../../hooks/usePermanentDelete';

interface Props {
    labelID: string;
    selectedIDs: string[];
}

const DeleteButton = ({ labelID = '', selectedIDs = [] }: Props) => {
    const [loading, withLoading] = useLoading();
    const [{ Shortcuts = 0 } = {}] = useMailSettings();
    const permanentDelete = usePermanentDelete(labelID);

    const handleDelete = async () => {
        await permanentDelete(selectedIDs);
    };

    const titleDelete = Shortcuts ? (
        <>
            {c('Action').t`Delete permanently`}
            <br />
            <kbd className="border-none">{metaKey}</kbd> + <kbd className="border-none">Backspace</kbd>
        </>
    ) : (
        c('Action').t`Delete permanently`
    );

    return (
        <ToolbarButton
            title={titleDelete}
            onClick={() => withLoading(handleDelete())}
            disabled={loading || !selectedIDs.length}
            data-testid="toolbar:deletepermanently"
            icon={<Icon name="circle-xmark" alt={c('Action').t`Delete permanently`} />}
        />
    );
};

export default DeleteButton;
