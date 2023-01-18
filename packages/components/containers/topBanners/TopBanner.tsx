import { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';

import Icon from '../../components/icon/Icon';
import { classnames } from '../../helpers';

interface Props {
    children: ReactNode;
    className?: string;
    onClose?: () => void;
}

const TopBanner = ({ children, className, onClose }: Props) => {
    return (
        <div
            role="alert"
            className={classnames([
                'flex flex-item-noshrink flex-nowrap text-center relative text-bold no-print',
                className,
            ])}
        >
            <div className="flex-item-fluid p0-5">{children}</div>
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
