import React from 'react';

interface Props {
    description?: React.ReactNode;
    text?: React.ReactNode;
    children?: React.ReactNode;
    img: React.ReactNode;
}

const OnboardingContent = ({ description, img, text, children }: Props) => {
    return (
        <>
            {description && <div className="mb1">{description}</div>}
            <div className="mb1 aligncenter">{img}</div>
            {text && <div className="mb1">{text}</div>}
            {children}
        </>
    );
};

export default OnboardingContent;
