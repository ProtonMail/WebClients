import { DetailedHTMLProps, HTMLAttributes, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface Props extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
    children?: ReactNode;
    className?: string;
}

const EditableSection = ({ children, className = '', ...rest }: Props) => {
    return (
        <div className={clsx(['w-full md:w-auto editable-section-container', className])} {...rest}>
            {children}
        </div>
    );
};

export default EditableSection;
