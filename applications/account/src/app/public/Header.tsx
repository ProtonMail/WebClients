import * as React from 'react';
import BackButton from './BackButton';

interface Props extends Omit<React.HTMLProps<HTMLDivElement>, 'title'> {
    right?: React.ReactNode;
    title?: React.ReactNode;
    subTitle?: React.ReactNode;
    onBack?: () => void;
}

const Header = ({ right, title, subTitle, onBack, ...rest }: Props) => {
    return (
        <div className="sign-layout-header" {...rest}>
            {onBack ? (
                <span className="absolute sign-layout-backbutton">
                    <BackButton onClick={onBack} />
                </span>
            ) : null}
            {title ? (
                <div className="flex flex-justify-space-between">
                    <h1 className="sign-layout-title mt1 mb0 on-mobile-mt0-5">{title}</h1>
                    {right}
                </div>
            ) : null}
            {subTitle ? <div className="mt0-25 color-weak on-mobile-mb2">{subTitle}</div> : null}
        </div>
    );
};

export default Header;
