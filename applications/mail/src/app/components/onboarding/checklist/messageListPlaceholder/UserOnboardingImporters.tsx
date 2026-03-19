import { c } from 'ttag';

import ProviderCard from '@proton/activation/src/components/SettingsArea/ProviderCards/ProviderCard';
import { Button } from '@proton/atoms/Button/Button';
import { APPS, BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { ChecklistKey } from '@proton/shared/lib/interfaces';
import checklistImportersImg from '@proton/styles/assets/img/illustrations/checklist-importers.svg';

import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';

interface Props {
    goToNextStep: () => void;
}

export const UserOnboardingImporters = ({ goToNextStep }: Props) => {
    const { markItemsAsDone } = useGetStartedChecklist();

    return (
        <>
            <div
                data-testid="onboarding-importers"
                className="m-auto max-w-custom py-6"
                style={{ '--max-w-custom': '28rem' }}
            >
                <div className="text-center mb-4 mx-4">
                    <img src={checklistImportersImg} alt="" className="mb-4" width={128} />
                    <h1 className="text-lg text-semibold mb-3">{c('Onboarding List Placeholder')
                        .t`Welcome to ${MAIL_APP_NAME}`}</h1>
                    <p className="color-weak m-0 mb-4">
                        {c('Onboarding List Placeholder')
                            .t`Switching email is hard. ${BRAND_NAME} makes it easy. Connect your old account and manage everything in one focused, ad-free workspace.`}
                    </p>
                </div>
                <ProviderCard
                    app={APPS.PROTONMAIL}
                    hasBorders={false}
                    showAdvancedImport={false}
                    header={
                        <span className="text-sm color-weak">{c('Onboarding List Placeholder')
                            .t`Choose your service`}</span>
                    }
                    onComplete={() => {
                        void markItemsAsDone(ChecklistKey.Import);
                        goToNextStep();
                    }}
                />
                <div className="text-center mb-4">
                    <Button shape="underline" className="color-weak text-sm" onClick={goToNextStep}>{c(
                        'Onboarding List Placeholder'
                    ).t`Maybe later`}</Button>
                </div>
            </div>
        </>
    );
};
