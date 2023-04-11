import { HTMLProps, ReactNode } from 'react';

import BackButton from './BackButton';

interface Props extends Omit<HTMLProps<HTMLDivElement>, 'title'> {
    right?: ReactNode;
    title?: ReactNode;
    subTitle?: ReactNode;
    onBack?: () => void;
    headingLevel?: number;
}

const Header = ({ right, title, subTitle, onBack, headingLevel, ...rest }: Props) => {
    return (
        <div className="sign-layout-header" {...rest}>
            {onBack ? (
                <span className="absolute sign-layout-backbutton no-mobile">
                    <BackButton onClick={onBack} />
                </span>
            ) : null}
            {title ? (
                <div className="flex flex-align-items-center flex-justify-space-between mb-2">
                    <h1 className="sign-layout-title my-0 sm:mt-4 md:mt-8" aria-level={headingLevel}>
                        {title}
                    </h1>
                    {right}
                </div>
            ) : null}
            {subTitle ? <div className="mt-1 color-weak mb-8 md:mb-0">{subTitle}</div> : null}
        </div>
    );
};

export default Header;
