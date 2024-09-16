import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { InlineLinkButton } from '@proton/atoms';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { PASS_BLOG_TRIAL_URL } from '@proton/pass/constants';
import { selectTrialDaysRemaining } from '@proton/pass/store/selectors';

export const FreeTrialActions: FC = () => {
    const daysRemaining = useSelector(selectTrialDaysRemaining);
    const { onLink } = usePassCore();

    return (
        <>
            {daysRemaining !== null && (
                <div className="text-sm">
                    {
                        // translator: the word "these" refers to premium features listed above
                        c('Info').ngettext(
                            msgid`You have ${daysRemaining} day left to try these and other premium features.`,
                            `You have ${daysRemaining} days left to try these and other premium features.`,
                            daysRemaining
                        )
                    }
                </div>
            )}
            <InlineLinkButton className="text-sm" onClick={() => onLink(PASS_BLOG_TRIAL_URL)}>
                {c('Action').t`Learn more`}
            </InlineLinkButton>
        </>
    );
};
