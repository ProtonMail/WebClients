import React from 'react';
import { Icon, classnames } from 'react-components';

interface Props {
    children: React.ReactNode;
    className?: string;
    onClose?: () => void;
}

const TopBanner = ({ children, className, onClose }: Props) => {
    return (
        <div className={classnames(['aligncenter p0-5 relative', className])}>
            {children}
            {onClose ? (
                <button type="button" className="right" onClick={onClose}>
                    <Icon name="off" />
                </button>
            ) : null}
        </div>
    );
};

export default TopBanner;
