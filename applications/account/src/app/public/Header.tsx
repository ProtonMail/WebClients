import * as React from 'react';

interface Props extends Omit<React.HTMLProps<HTMLDivElement>, 'title'> {
    left?: React.ReactNode;
    title?: React.ReactNode;
    subTitle?: React.ReactNode;
}

const Header = ({ left, title, subTitle, ...rest }: Props) => {
    return (
        <div className="sign-layout-header" {...rest}>
            {left ? <span className="absolute sign-layout-backbutton">{left}</span> : null}
            {title ? (
                <h1 className="sign-layout-title text-center mt1 mb0-5">
                    <strong>{title}</strong>
                </h1>
            ) : null}
            {subTitle ? <div className="mb1 text-center text-sm mt0 color-weak">{subTitle}</div> : null}
        </div>
    );
};

export default Header;
