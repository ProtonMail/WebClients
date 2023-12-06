import { ComponentPropsWithoutRef } from 'react';

import clsx from '@proton/utils/clsx';

import './SettingsLayoutRight.scss';

interface Props extends ComponentPropsWithoutRef<'div'> {
    className?: string;
    /**
     * isToggleContainer must be used if SettingsLayoutRight only contains a toggle.
     */
    isToggleContainer?: boolean;
}

const SettingsLayoutRight = ({ className, children, isToggleContainer, ...rest }: Props) => {
    return (
        <div
            className={clsx([
                'settings-layout-right',
                isToggleContainer && 'settings-layout-right--toggle-container',
                className,
            ])}
            {...rest}
        >
            {children}
        </div>
    );
};

export default SettingsLayoutRight;
