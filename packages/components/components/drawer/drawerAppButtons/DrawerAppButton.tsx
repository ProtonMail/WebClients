import { ComponentPropsWithRef, ReactNode } from 'react';

import { c } from 'ttag';

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
}

const DrawerAppButton = ({
    tooltipText,
    buttonContent,
    onClick,
    alt,
    notificationDotColor,
    tooltipPlacement = 'left',
    ...rest
}: Props) => {
    const button = (
        <button
            className={clsx(
                'drawer-sidebar-button rounded flex interactive no-pointer-events-children relative',
                notificationDotColor && 'drawer-sidebar-button--notification'
            )}
            type="button"
            onClick={onClick}
            {...rest}
        >
            {buttonContent}
            {notificationDotColor && (
                <NotificationDot
                    className="top right notification-dot--top-right"
                    color={notificationDotColor}
                    alt={c('Action').t`Attention required`}
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
