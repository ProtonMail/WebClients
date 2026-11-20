import { c } from 'ttag';

import { featureTourActions } from '@proton/account/featuresTour';
import useToggle from '@proton/hooks/useToggle';
import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { AUTO_DELETE_SPAM_AND_TRASH_DAYS } from '@proton/shared/lib/mail/mailSettings';
import autoDeleteIllustration from '@proton/styles/assets/img/illustrations/new-upsells-img/auto-delete.svg';

import type { FeatureTourStepProps, ShouldDisplayTourStep } from '../interface';
import FeatureTourStepCTA from './components/FeatureTourStepCTA';
import FeatureTourStepsContent from './components/FeatureTourStepsContent';
import FeatureTourToggle from './components/FeatureTourToggle';

export const shouldDisplayAutoDeleteTourStep: ShouldDisplayTourStep = async () => ({
    canDisplay: true,
    preloadUrls: [autoDeleteIllustration],
});

const AutoDeleteTourStep = (props: FeatureTourStepProps) => {
    const { update } = useUpdateMailSetting();
    const dispatch = useDispatch();
    const [mailSettings] = useMailSettings();
    const { state: isToggleChecked, toggle } = useToggle(true);
    const isFeatureEnabled = mailSettings.AutoDeleteSpamAndTrashDays === AUTO_DELETE_SPAM_AND_TRASH_DAYS.ACTIVE;

    const handleEnableFeature = () => {
        if (isToggleChecked && !isFeatureEnabled) {
            update('AutoDeleteSpamAndTrashDays', AUTO_DELETE_SPAM_AND_TRASH_DAYS.ACTIVE, {
                notify: false,
                onSuccess: () => dispatch(featureTourActions.activateFeature({ feature: 'auto-delete' })),
            });
        }
    };

    return (
        <FeatureTourStepsContent
            bullets={props.bullets}
            illustrationSize="small"
            illustration={autoDeleteIllustration}
            title={c('Title').t`No need to empty the trash`}
            mainCTA={
                <FeatureTourStepCTA
                    type="primary"
                    onClick={() => {
                        void handleEnableFeature();
                        props.onNext();
                    }}
                >
                    {c('Button').t`Next`}
                </FeatureTourStepCTA>
            }
        >
            <p className="mt-0 mb-4">
                {c('Info').t`Automatically clear out emails moved to Trash and Spam more than 30 days ago.`}
            </p>
            <FeatureTourToggle
                isFeatureEnabled={isFeatureEnabled}
                checked={isToggleChecked}
                onToggle={toggle}
                title={c('Action').t`Auto-delete spam and trash`}
            />
        </FeatureTourStepsContent>
    );
};

export default AutoDeleteTourStep;
