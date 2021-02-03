import React from 'react';
import { classnames } from '../../helpers';

interface Props extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
    children?: React.ReactNode;
    className?: string;
}

const EditableSection = ({ children, className = '', ...rest }: Props) => {
    return (
        <div
            className={classnames(['inline-grid-container on-mobile-w100 editable-section-container', className])}
            {...rest}
        >
            {children}
        </div>
    );
};

export default EditableSection;
