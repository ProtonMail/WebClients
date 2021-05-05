import React from 'react';

export interface Props extends React.HTMLProps<HTMLDivElement> {
    description?: React.ReactNode;
    children?: React.ReactNode;
    img?: React.ReactNode;
}

const OnboardingContent = ({ description, img, children, title, ...rest }: Props) => {
    return (
        <div {...rest}>
            {img && <div className="mb0-5 text-center mauto w66 on-mobile-w100">{img}</div>}
            {title && <h1 className="mb1 text-2xl text-bold text-center">{title}</h1>}
            {description && <div className="mb1 text-center">{description}</div>}
            {children}
        </div>
    );
};

export default OnboardingContent;
