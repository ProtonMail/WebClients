import React from 'react';
import { c } from 'ttag';
import { LinkButton } from 'react-components';

interface Props {
    onUndo: () => void;
    loading?: boolean;
}

const UndoButton = ({ onUndo, loading }: Props) => (
    <LinkButton
        loading={loading}
        className="alignbaseline p0 nodecoration bold pm-button--currentColor"
        onClick={onUndo}
    >
        {c('Action').t`Undo`}
    </LinkButton>
);

export default UndoButton;
