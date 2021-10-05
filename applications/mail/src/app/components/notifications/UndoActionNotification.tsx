import { classnames } from '@proton/components';

import UndoButton from './UndoButton';

interface Props {
    children: React.ReactNode;
    onUndo?: () => void;
}

const UndoActionNotification = ({ children, onUndo }: Props) => (
    <>
        <span className={classnames([onUndo && 'mr1'])}>{children}</span>
        {onUndo ? <UndoButton onUndo={onUndo} /> : null}
    </>
);

export default UndoActionNotification;
