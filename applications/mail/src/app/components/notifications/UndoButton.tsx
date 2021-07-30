import React from 'react';
import { c } from 'ttag';
import { InlineLinkButton } from '@proton/components';

interface Props {
    onUndo: () => void;
    className?: string;
}

const UndoButton = ({ onUndo, className }: Props) => (
    <InlineLinkButton onClick={onUndo} className={className}>{c('Action').t`Undo`}</InlineLinkButton>
);

export default UndoButton;
