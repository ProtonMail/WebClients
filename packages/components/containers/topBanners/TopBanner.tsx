import React from 'react';

import { classnames } from '../../helpers';
import Icon from '../../components/icon/Icon';

interface Props {
    children: React.ReactNode;
    className?: string;
    onClose?: () => void;
}

const TopBanner = ({ children, className, onClose }: Props) => {
    return (
        <div className={classnames(['text-center p0-5 relative text-bold', className])}>
            {children}
            {onClose ? (
                <button type="button" className="float-right" onClick={onClose}>
                    <Icon name="off" />
                </button>
            ) : null}
        </div>
    );
};

export default TopBanner;
