import { type FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import createItemArrow from '@proton/pass/assets/b2b-onboarding/create-arrow.svg';

export const OnboardingArrow: FC = () => {
    return (
        <div className="relative flex flex-nowrap items-end">
            <Button pill shape="outline" color="norm" className="border-primary pointer-events-none">{c('Action')
                .t`Create new items`}</Button>
            <img src={createItemArrow} alt="" className="pb-4" />
        </div>
    );
};
