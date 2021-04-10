import React from 'react';
import { Icon, useLoading, useMailSettings, ToolbarButton } from 'react-components';
import { metaKey } from 'proton-shared/lib/helpers/browser';
import { c } from 'ttag';

import { usePermanentDelete } from '../../hooks/usePermanentDelete';

interface Props {
    labelID: string;
    selectedIDs: string[];
}

const DeleteButton = ({ labelID = '', selectedIDs = [] }: Props) => {
    const [loading, withLoading] = useLoading();
    const [{ Shortcuts = 1 } = {}] = useMailSettings();
    const permanentDelete = usePermanentDelete(labelID);

    const handleDelete = async () => {
        await permanentDelete(selectedIDs);
    };

    const titleDelete = Shortcuts ? (
        <>
            {c('Action').t`Delete permanently`}
            <br />
            <kbd className="no-border">{metaKey}</kbd> + <kbd className="no-border">Backspace</kbd>
        </>
    ) : (
        c('Action').t`Delete permanently`
    );

    return (
        <ToolbarButton
            title={titleDelete}
            onClick={() => withLoading(handleDelete())}
            disabled={loading || !selectedIDs.length}
            data-test-id="toolbar:deletepermanently"
            icon={<Icon name="delete" alt={c('Action').t`Delete permanently`} />}
        />
    );
};

export default DeleteButton;
