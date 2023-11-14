import { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { isElectronOnMac } from '@proton/shared/lib/helpers/desktop';
import clsx from '@proton/utils/clsx';

import Icon from '../../components/icon/Icon';

interface Props {
    children: ReactNode;
    className?: string;
    onClose?: () => void;
    'data-testid'?: string;
}

const TopBanner = ({ children, className, onClose, ...rest }: Props) => {
    const isElectronOnMacComputers = isElectronOnMac();
    return (
        <div
            role="alert"
            className={clsx([
                'flex flex-item-noshrink flex-nowrap text-center relative text-bold no-print',
                className,
                isElectronOnMacComputers && 'pt-4',
            ])}
            {...rest}
        >
            <div className="flex-item-fluid p-2">{children}</div>
            {onClose ? (
                <Button
                    icon
                    shape="ghost"
                    className="flex-item-noshrink rounded-none"
                    onClick={onClose}
                    title={c('Action').t`Close this banner`}
                >
                    <Icon name="cross" alt={c('Action').t`Close this banner`} />
                </Button>
            ) : null}
        </div>
    );
};

export default TopBanner;
