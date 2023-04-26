import { c } from 'ttag';

import { Icon } from '@proton/components/components';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';

import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';

import './UsersOnboardingChecklist.scss';

interface Props {
    smallVariant?: boolean;
}

const OnboardingChecklistHeader = ({ smallVariant }: Props) => {
    const { isUserPaid, isChecklistFinished, changeChecklistDisplay } = useGetStartedChecklist();

    const SubTitle = () => {
        if (isUserPaid) {
            return null;
        }

        if (isChecklistFinished) {
            return (
                <p className="m-0 color-weak">{c('Get started checklist instructions')
                    .t`Congratulation, you completed all the steps!`}</p>
            );
        }

        return (
            <p className="m-0 color-weak">{c('Get started checklist instructions')
                .t`Get 1 GB total storage for completing these steps`}</p>
        );
    };

    return smallVariant ? (
        <div className="flex flex-justify-space-between text-sm px-3">
            <p className="m-0 mb-2">{c('Get started checklist instructions').t`Continue setting up your email`}</p>
            <Icon
                name="cross"
                className="cursor-pointer"
                onClick={() => changeChecklistDisplay(CHECKLIST_DISPLAY_TYPE.HIDDEN)}
            />
        </div>
    ) : (
        <div className="text-center">
            <p className="m-0 mb-1 text-lg text-bold">{c('Get started checklist instructions')
                .t`Protect and simplify your email`}</p>
            <SubTitle />
        </div>
    );
};

export default OnboardingChecklistHeader;
