import type { HTMLProps, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import BackButton from './BackButton';

interface Props extends Omit<HTMLProps<HTMLDivElement>, 'title'> {
    center?: boolean;
    right?: ReactNode;
    title?: ReactNode;
    belowTitle?: ReactNode;
    subTitle?: ReactNode;
    onBack?: () => void;
    headingLevel?: number;
}

const Header = ({ center, className, right, title, belowTitle, subTitle, onBack, headingLevel, ...rest }: Props) => {
    return (
        <div
            className={clsx('sign-layout-header', title ? 'mb-6' : undefined, center && 'text-center', className)}
            {...rest}
        >
            {onBack ? (
                <span className="absolute sign-layout-backbutton hidden md:flex">
                    <BackButton onClick={onBack} />
                </span>
            ) : null}
            {title ? (
                <div className={clsx(!!right && 'flex items-center justify-space-between')}>
                    <h1 className="sign-layout-title" aria-level={headingLevel}>
                        {title}
                    </h1>
                    {right}
                </div>
            ) : null}
            {belowTitle}
            {subTitle ? <div className="mt-2 color-weak">{subTitle}</div> : null}
        </div>
    );
};

export default Header;
