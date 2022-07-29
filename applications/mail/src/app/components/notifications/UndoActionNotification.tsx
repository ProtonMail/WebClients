import { ReactNode } from 'react';

import { classnames } from '@proton/components';

import UndoButton from './UndoButton';

interface Props {
    children: ReactNode;
    additionalButton?: ReactNode;
    onUndo?: () => void;
}

const UndoActionNotification = ({ children, additionalButton = null, onUndo }: Props) => (
    <>
        <span className={classnames([(onUndo || additionalButton !== null) && 'mr1'])}>{children}</span>
        {additionalButton ? additionalButton : null}
        {onUndo ? <UndoButton onUndo={onUndo} /> : null}
    </>
);

export default UndoActionNotification;
