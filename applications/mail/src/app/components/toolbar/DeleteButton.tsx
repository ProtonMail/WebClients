import React from 'react';
import { Icon, useLoading, useMailSettings } from 'react-components';
import { metaKey } from 'proton-shared/lib/helpers/browser';
import { c } from 'ttag';

import ToolbarButton from './ToolbarButton';
import { usePermanentDelete } from '../../hooks/usePermanentDelete';

interface Props {
    labelID: string;
    selectedIDs: string[];
}

const DeleteButton = ({ labelID = '', selectedIDs = [] }: Props) => {
    const [loading, withLoading] = useLoading();
    const [{ Shortcuts } = { Shortcuts: 0 }] = useMailSettings();
    const permanentDelete = usePermanentDelete(labelID);

    const handleDelete = async () => {
        await permanentDelete(selectedIDs);
    };

    const titleDelete = Shortcuts ? (
        <>
            {c('Action').t`Delete permanently`}
            <br />
            <kbd className="bg-global-altgrey noborder">{metaKey}</kbd> +{' '}
            <kbd className="bg-global-altgrey noborder">Backspace</kbd>
        </>
    ) : (
        c('Action').t`Delete permanently`
    );

    return (
        <ToolbarButton
            loading={loading}
            title={titleDelete}
            onClick={() => withLoading(handleDelete())}
            disabled={!selectedIDs.length}
            data-test-id="toolbar:deletepermanently"
        >
            <Icon className="toolbar-icon mauto" name="delete" alt={c('Action').t`Delete permanently`} />
        </ToolbarButton>
    );
};

export default DeleteButton;
