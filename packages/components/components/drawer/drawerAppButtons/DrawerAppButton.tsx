import { ComponentPropsWithRef, ReactNode } from 'react';

import { c } from 'ttag';

import { NotificationCounter } from '@proton/atoms/NotificationCounter';
import { NotificationDot } from '@proton/atoms/NotificationDot';
import { ThemeColor } from '@proton/colors/types';
import { PopperPlacement, Tooltip } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

export interface Props extends ComponentPropsWithRef<'button'> {
    tooltipText: string;
    tooltipPlacement?: PopperPlacement;
    buttonContent: ReactNode;
    onClick: () => void;
    /** If specified, renders an sr-only element for screenreaders */
    alt?: string;
    notificationDotColor?: ThemeColor;
    notificationDotCounter?: number;
}

const DrawerAppButton = ({
    tooltipText,
    buttonContent,
    onClick,
    alt,
    notificationDotColor,
    notificationDotCounter,
    tooltipPlacement = 'left',
    ...rest
}: Props) => {
    const button = (
        <button
            className={clsx(
                'drawer-sidebar-button rounded flex interactive *:pointer-events-none relative',
                notificationDotColor && 'drawer-sidebar-button--notification'
            )}
            type="button"
            onClick={onClick}
            {...rest}
        >
            {buttonContent}
            {notificationDotColor && notificationDotCounter === undefined && (
                <NotificationDot
                    className="top-0 right-0 notification-dot--top-right"
                    color={notificationDotColor}
                    alt={c('Action').t`Attention required`}
                />
            )}
            {notificationDotColor && notificationDotCounter !== undefined && (
                <NotificationCounter
                    className="top-0 right-0 notification-counter--top-right"
                    color={notificationDotColor}
                    alt={
                        // translator: this is in a small rounded icon placed on top of security center button, to show the number of items to pay attention to
                        c('Action').t`Attention required`
                    }
                    count={notificationDotCounter}
                />
            )}
            {alt ? <span className="sr-only">{alt}</span> : null}
        </button>
    );

    return (
        <Tooltip title={tooltipText} originalPlacement={tooltipPlacement}>
            {button}
        </Tooltip>
    );
};

export default DrawerAppButton;
