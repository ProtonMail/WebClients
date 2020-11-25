import React, { useRef } from 'react';
import PropTypes from 'prop-types';

import Portal from '../portal/Portal';
import { classnames } from '../../helpers';
import { useFocusTrap } from '../focus';

const CLASSES = {
    MODAL: 'pm-modal',
    MODAL_IN: 'pm-modalIn',
    MODAL_OUT: 'pm-modalOut',
    MODAL_SMALL: 'pm-modal--smaller',
};

/** @type any */
const Dialog = ({
    onEnter,
    onExit,
    small: isSmall = false,
    isClosing = false,
    // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
    isFirst = false,
    // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
    isLast = false,
    isBehind = false,
    modalTitleID,
    children,
    className: extraClassNames = '',
    ...rest
}) => {
    const rootRef = useRef(null);
    const focusTrapProps = useFocusTrap({ rootRef });

    const handleAnimationEnd = ({ animationName }) => {
        if (animationName === CLASSES.MODAL_OUT && isClosing) {
            onExit?.();
        }
        if (animationName === CLASSES.MODAL_IN && !isClosing) {
            onEnter?.();
        }
    };

    return (
        <Portal>
            <div className={classnames(['pm-modalContainer', isBehind && 'pm-modalContainer--inBackground'])}>
                <dialog
                    aria-labelledby={modalTitleID}
                    aria-modal="true"
                    open
                    className={classnames([
                        CLASSES.MODAL,
                        isSmall && CLASSES.MODAL_SMALL,
                        isSmall && 'pm-modal--shorterLabels',
                        isClosing && CLASSES.MODAL_OUT,
                        extraClassNames,
                        'no-outline',
                    ])}
                    onAnimationEnd={handleAnimationEnd}
                    {...rest}
                    ref={rootRef}
                    {...focusTrapProps}
                >
                    {children}
                </dialog>
            </div>
        </Portal>
    );
};

Dialog.propTypes = {
    onEnter: PropTypes.func,
    onExit: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    modalTitleID: PropTypes.string.isRequired,
    className: PropTypes.string,
    small: PropTypes.bool,
    isBehind: PropTypes.bool,
    isFirst: PropTypes.bool,
    isLast: PropTypes.bool,
    isClosing: PropTypes.bool,
};

export default Dialog;
