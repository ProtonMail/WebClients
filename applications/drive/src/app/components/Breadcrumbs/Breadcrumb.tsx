import React from 'react';
import { classnames, Icon } from 'react-components';

interface Props {
    children: string;
    onClick: () => void;
    current?: boolean;
}

const Breadcrumb = ({ onClick, children, current }: Props) => {
    return (
        <>
            <div className={classnames(['pd-breadcrumb', current && 'pd-breadcrumb--active'])}>
                <button title={children} onClick={onClick} className="pd-breadcrumb-button">
                    {children}
                </button>
            </div>
            {!current && <Icon size={12} className="opacity-50 flex-item-noshrink" name="caret" rotate={270} />}
        </>
    );
};

export default Breadcrumb;
