import * as React from 'react';

import { LearnMore, LearnMoreProps } from '../../components';
import { classnames } from '../../helpers';

interface SettingsParagraphProps extends React.ComponentPropsWithoutRef<'p'> {
    learnMoreUrl?: string;
    learnMoreProps?: Omit<LearnMoreProps, 'url'>;
}

const SettingsParagraph = ({ learnMoreUrl, learnMoreProps, className, children, ...rest }: SettingsParagraphProps) => {
    const learnMoreElement = learnMoreUrl ? (
        <>
            <br />
            <LearnMore url={learnMoreUrl} {...learnMoreProps} />
        </>
    ) : null;

    return (
        <p className={classnames(['max-w43e color-weak', className])} {...rest}>
            {children}
            {learnMoreElement}
        </p>
    );
};

export default SettingsParagraph;
