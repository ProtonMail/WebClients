import { HTMLProps, ReactNode } from 'react';

export interface Props extends HTMLProps<HTMLDivElement> {
    description?: ReactNode;
    children?: ReactNode;
    img?: ReactNode;
}

const OnboardingContent = ({ description, img, children, title, ...rest }: Props) => {
    return (
        <div {...rest}>
            {img && <div className="pb-4 text-center m-auto w-full">{img}</div>}
            {title && <h1 className="mb-2 text-2xl text-bold text-center">{title}</h1>}
            {description && <div className="mb-8 text-center color-weak">{description}</div>}
            {children && <div className="mb-8">{children}</div>}
        </div>
    );
};

export default OnboardingContent;
