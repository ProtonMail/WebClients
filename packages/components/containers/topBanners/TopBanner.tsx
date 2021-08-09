import * as React from 'react';
import { c } from 'ttag';

import { classnames } from '../../helpers';
import Icon from '../../components/icon/Icon';
import { Button } from '../../components';

interface Props {
    children: React.ReactNode;
    className?: string;
    onClose?: () => void;
}

const TopBanner = ({ children, className, onClose }: Props) => {
    return (
        <div className={classnames(['flex flex-nowrap text-center relative text-bold', className])}>
            <div className="flex-item-fluid p0-5">{children}</div>
            {onClose ? (
                <Button
                    icon
                    shape="ghost"
                    className="flex-item-noshrink"
                    onClick={onClose}
                    title={c('Action').t`Close this banner`}
                >
                    <Icon name="xmark" alt={c('Action').t`Close this banner`} />
                </Button>
            ) : null}
        </div>
    );
};

export default TopBanner;
