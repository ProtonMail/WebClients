import { ReactNode } from 'react';

interface Props {
    children?: ReactNode;
    className?: string;
}

const Field = ({ children, className }: Props) => {
    return <div className={['field-container', className].filter(Boolean).join(' ')}>{children}</div>;
};

export default Field;
