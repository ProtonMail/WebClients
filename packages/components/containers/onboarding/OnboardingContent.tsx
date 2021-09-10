import { HTMLProps, ReactNode } from 'react';

export interface Props extends HTMLProps<HTMLDivElement> {
    description?: ReactNode;
    children?: ReactNode;
    img?: ReactNode;
}

const OnboardingContent = ({ description, img, children, title, ...rest }: Props) => {
    return (
        <div {...rest}>
            {img && <div className="pb1 text-center mauto w66 on-mobile-w100">{img}</div>}
            {title && <h1 className="mb0-5 text-2xl text-bold text-center">{title}</h1>}
            {description && <div className="mb2 text-center">{description}</div>}
            {children}
        </div>
    );
};

export default OnboardingContent;
