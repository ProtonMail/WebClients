import { DetailedHTMLProps, HTMLAttributes, ReactNode } from 'react';
import { classnames } from '../../helpers';

interface Props extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
    children?: ReactNode;
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
