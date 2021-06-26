import React from 'react';
import { c } from 'ttag';
import { InlineLinkButton } from 'react-components';

interface Props {
    onUndo: () => void;
}

const UndoButton = ({ onUndo }: Props) => <InlineLinkButton onClick={onUndo}>{c('Action').t`Undo`}</InlineLinkButton>;

export default UndoButton;
