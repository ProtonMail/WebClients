import React from 'react';

export interface Props extends React.HTMLProps<HTMLDivElement> {
    description?: React.ReactNode;
    text?: React.ReactNode;
    children?: React.ReactNode;
    img: React.ReactNode;
}

const OnboardingContent = ({ description, img, text, children, ...rest }: Props) => {
    return (
        <div {...rest}>
            {description && <div className="mb1">{description}</div>}
            <div className="mb1 aligncenter">{img}</div>
            {text && <div className="mb1">{text}</div>}
            {children}
        </div>
    );
};

export default OnboardingContent;
