import React from 'react';
import { c } from 'ttag';
import { LinkButton } from 'react-components';

interface Props {
    onUndo: () => void;
}

const UndoButton = ({ onUndo }: Props) => (
    <LinkButton role="button" className="alignbaseline nodecoration bold pm-button--currentColor" onClick={onUndo}>
        {c('Action').t`Undo`}
    </LinkButton>
);

export default UndoButton;
