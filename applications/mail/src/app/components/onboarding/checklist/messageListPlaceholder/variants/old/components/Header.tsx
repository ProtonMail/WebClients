import React from 'react';

import { c } from 'ttag';

interface Props {
    isUserPaid: boolean;
    userWasRewarded: boolean;
    isChecklistFinished: boolean;
}

const OldOnboardingChecklistPlaceholderHeader = ({ isUserPaid, userWasRewarded, isChecklistFinished }: Props) => {
    const SubTitle = () => {
        if (isUserPaid || userWasRewarded) {
            return null;
        }

        if (isChecklistFinished) {
            return (
                <p className="m-0 color-weak">{c('Get started checklist instructions')
                    .t`Congratulations, you completed all the steps!`}</p>
            );
        }

        return (
            <p className="m-0 color-weak w-2/3 m-auto">{c('Get started checklist instructions')
                .t`Double your free storage to 1 GB when you complete the following:`}</p>
        );
    };

    return (
        <div className="text-center">
            <p className="m-0 mb-1 text-lg text-bold">{c('Get started checklist instructions')
                .t`Protect and simplify your email`}</p>
            <SubTitle />
        </div>
    );
};

export default OldOnboardingChecklistPlaceholderHeader;
