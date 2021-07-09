import React, { useState, useLayoutEffect } from 'react';
import { classnames } from '@proton/components';

import UndoButton from './UndoButton';

interface Props {
    children: React.ReactNode;
    onUndo?: () => void;
    promise: Promise<any>;
}

const UndoActionNotification = ({ children, onUndo, promise }: Props) => {
    const [disabled, setDisabled] = useState(true);

    useLayoutEffect(() => {
        promise.then(() => setDisabled(false));
    }, []);

    return (
        <>
            <span className={classnames([onUndo && 'mr1'])}>{children}</span>
            {onUndo ? <UndoButton disabled={disabled} onUndo={onUndo} /> : null}
        </>
    );
};

export default UndoActionNotification;
