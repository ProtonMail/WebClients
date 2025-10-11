import type { ComponentPropsWithoutRef } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import clsx from '@proton/utils/clsx';

interface SettingsParagraphProps extends ComponentPropsWithoutRef<'p'> {
    inlineLearnMore?: boolean;
    learnMoreUrl?: string;
    learnMoreText?: string;
    large?: boolean;
}

const SettingsParagraph = ({
    learnMoreUrl,
    inlineLearnMore = false,
    learnMoreText = c('Link').t`Learn more`,
    className,
    children,
    large,
    ...rest
}: SettingsParagraphProps) => {
    const learnMoreElement = learnMoreUrl ? (
        <>
            {inlineLearnMore ? ' ' : <br />}
            <Href href={learnMoreUrl} className={className}>
                {learnMoreText}
            </Href>
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
