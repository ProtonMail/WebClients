import { c } from 'ttag';

import { InlineLinkButton } from '@proton/components';

interface Props {
    onMoveAll: () => void;
    isMessage: boolean;
    isLabel: boolean;
    className?: string;
    disabled?: boolean;
}

const getText = (isMessage: boolean, isLabel: boolean) => {
    if (isMessage) {
        if (isLabel) {
            return c('Action').t`Move all messages from this label`;
        } else {
            return c('Action').t`Move all messages from this folder`;
        }
    } else {
        if (isLabel) {
            return c('Action').t`Move all conversations from this label`;
        } else {
            return c('Action').t`Move all conversations from this folder`;
        }
    }
};

const UndoButton = ({ onMoveAll, isMessage, isLabel, disabled, className }: Props) => (
    <InlineLinkButton onClick={onMoveAll} disabled={disabled} className={className}>
        {getText(isMessage, isLabel)}
    </InlineLinkButton>
);

export default UndoButton;
