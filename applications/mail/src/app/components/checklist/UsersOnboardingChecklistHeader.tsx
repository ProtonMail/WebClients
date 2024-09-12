import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, Tooltip } from '@proton/components';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';

import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';

import './UsersOnboardingChecklist.scss';

interface Props {
    smallVariant?: boolean;
}

const UsersOnboardingChecklistHeader = ({ smallVariant }: Props) => {
    const { isUserPaid, isChecklistFinished, changeChecklistDisplay, userWasRewarded } = useGetStartedChecklist();

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

    return smallVariant ? (
        <div className="flex justify-space-between items-center flex-nowrap text-sm px-2 mb-2">
            <p className="m-0">
                {isChecklistFinished
                    ? c('Get started checklist instructions').t`Congratulations, you finished!`
                    : c('Get started checklist instructions').t`Continue setting up your email`}
            </p>
            <Tooltip
                title={c('Get started checklist instructions').t`Closing this means giving up the free storage bonus.`}
            >
                <Button
                    icon
                    shape="ghost"
                    size="small"
                    className="shrink-0"
                    onClick={() => changeChecklistDisplay(CHECKLIST_DISPLAY_TYPE.HIDDEN)}
                >
                    <Icon
                        data-testid="onboarding-checklist-header-hide-button"
                        name="cross"
                        alt={c('Action').t`Close the checklist`}
                    />
                </Button>
            </Tooltip>
        </div>
    ) : (
        <div className="text-center">
            <p className="m-0 mb-1 text-lg text-bold">{c('Get started checklist instructions')
                .t`Protect and simplify your email`}</p>
            <SubTitle />
        </div>
    );
};

export default UsersOnboardingChecklistHeader;
