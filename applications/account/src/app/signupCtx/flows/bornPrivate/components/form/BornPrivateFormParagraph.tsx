import type { ReactNode } from 'react';

interface FormParagraphProps {
    children: ReactNode;
}

const BornPrivateFormParagraph = ({ children }: FormParagraphProps) => {
    return <p className="my-1 text-lg color-weak">{children}</p>;
};

export default BornPrivateFormParagraph;
