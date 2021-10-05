import { c } from 'ttag';
import { InlineLinkButton } from '@proton/components';

interface Props {
    onUndo: () => void;
    className?: string;
    disabled?: boolean;
}

const UndoButton = ({ onUndo, disabled, className }: Props) => (
    <InlineLinkButton onClick={onUndo} disabled={disabled} className={className}>{c('Action').t`Undo`}</InlineLinkButton>
);

export default UndoButton;
