import { ComponentPropsWithoutRef } from 'react';

import clsx from '@proton/utils/clsx';

import { LearnMore, LearnMoreProps } from '../../components';

interface SettingsParagraphProps extends ComponentPropsWithoutRef<'p'> {
    learnMoreUrl?: string;
    learnMoreProps?: Omit<LearnMoreProps, 'url'>;
    large?: boolean;
}

const SettingsParagraph = ({
    learnMoreUrl,
    learnMoreProps,
    className,
    children,
    large,
    ...rest
}: SettingsParagraphProps) => {
    const learnMoreElement = learnMoreUrl ? (
        <>
            <br />
            <LearnMore url={learnMoreUrl} {...learnMoreProps} />
        </>
    ) : null;

    return (
        <p
            className={clsx(['color-weak mt-0 max-w-custom', className])}
            style={{ '--max-w-custom': large ? '57em' : '43em' }}
            {...rest}
        >
            {children}
            {learnMoreElement}
        </p>
    );
};

export default SettingsParagraph;
