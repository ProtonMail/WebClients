import { Children, MouseEventHandler, PropsWithChildren, ReactElement, useEffect } from 'react';

import { SpotlightProps } from '@proton/components/components';

/**
 * Raw spotlight used as a mock for testing
 */
export const SpotlightMock = ({ children, show, content, onClose, onDisplayed }: PropsWithChildren<SpotlightProps>) => {
    const child = Children.only(children) as ReactElement;

    const handleClose: MouseEventHandler = (event) => {
        onClose?.(event);
    };

    useEffect(() => {
        if (show) {
            onDisplayed?.();
        }
    }, [show]);

    return (
        <>
            {child}
            <div className="spotlight">
                <div>{content}</div>
                <button title={'Close'} className="spotlight-close" onClick={handleClose}>
                    {'Close'}
                </button>
            </div>
        </>
    );
};
