import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import { isElectronOnMac } from '@proton/shared/lib/helpers/desktop';
import clsx from '@proton/utils/clsx';

interface Props {
    children: ReactNode;
    className?: string;
    onClose?: () => void;
    'data-testid'?: string;
}

const TopBanner = ({ children, className, onClose, ...rest }: Props) => {
    return (
        <div
            role="alert"
            className={clsx([
                'flex shrink-0 flex-nowrap text-center relative text-bold no-print',
                className,
                isElectronOnMac && 'pt-4',
            ])}
            {...rest}
        >
            <div className="flex-1 p-2">{children}</div>
            {onClose ? (
                <Button
                    icon
                    shape="ghost"
                    className="shrink-0 rounded-none"
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
