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
        className="align-baseline p0 text-no-decoration text-bold button--currentColor"
        onClick={onUndo}
    >
        {c('Action').t`Undo`}
    </LinkButton>
);

export default UndoButton;
