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
        <div
            className={clsx(['color-weak mb-5 max-w-custom', className])}
            style={{ '--max-w-custom': large ? '57em' : '43em' }}
            {...rest}
        >
            {children}
            {learnMoreElement}
        </div>
    );
};

export default SettingsParagraph;
