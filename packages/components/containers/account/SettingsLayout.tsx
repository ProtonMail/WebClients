import { ComponentPropsWithoutRef } from 'react';

import clsx from '@proton/utils/clsx';

import './SettingsLayout.scss';

interface Props extends ComponentPropsWithoutRef<'div'> {
    className?: string;
    /**
     * stackEarlier is used when content needs to be stacked earlier than only for mobile
     * this is a "temporary" option, will be soon revamped with settings responsive refactor
     */
    stackEarlier?: boolean;
}

const SettingsLayout = ({ className = '', stackEarlier = false, ...rest }: Props) => {
    return (
        <div
            className={clsx(['settings-layout', stackEarlier && 'settings-layout--stack-earlier', className])}
            {...rest}
        />
    );
};

export default SettingsLayout;
