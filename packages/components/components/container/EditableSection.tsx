import React from 'react';
import { classnames } from '../../helpers';

interface Props extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
    children?: React.ReactNode;
    className?: string;
}

const EditableSection = ({ children, className = '', ...rest }: Props) => {
    return (
        <div
            className={classnames(['inline-grid-container onmobile-w100 editableSection-container', className])}
            {...rest}
        >
            {children}
        </div>
    );
};

export default EditableSection;
