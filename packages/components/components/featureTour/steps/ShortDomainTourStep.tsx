import { c } from 'ttag';

import { addressesThunk } from '@proton/account/addresses';
import { useAddresses } from '@proton/account/addresses/hooks';
import { featureTourActions } from '@proton/account/featuresTour';
import { userThunk } from '@proton/account/user';
import useToggle from '@proton/hooks/useToggle';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { getIsBYOEOnlyAccount } from '@proton/shared/lib/helpers/address';
import { SentryMailInitiatives, traceError } from '@proton/shared/lib/helpers/sentry';
import shortDomainImg from '@proton/styles/assets/img/illustrations/new-upsells-img/pm-me.svg';

import useShortDomainAddress from '../../../hooks/mail/useShortDomainAddress';
import type { FeatureTourStepProps, ShouldDisplayTourStep } from '../interface';
import FeatureTourStepCTA from './components/FeatureTourStepCTA';
import FeatureTourStepsContent from './components/FeatureTourStepsContent';
import FeatureTourToggle from './components/FeatureTourToggle';

export const shouldDisplayShortDomainTourStep: ShouldDisplayTourStep = async (dispatch) => {
    const [user, addresses] = await Promise.all([dispatch(userThunk()), dispatch(addressesThunk())]);
    return {
        canDisplay:
            addresses !== undefined && addresses.length > 0 && user.hasPaidMail && !getIsBYOEOnlyAccount(addresses),
        preloadUrls: [shortDomainImg],
    };
};

const ShortDomainTourStep = (props: FeatureTourStepProps) => {
    const dispatch = useDispatch();
    const [addresses] = useAddresses();
    const { hasShortDomain, shortDomainAddress, createShortDomainAddress } = useShortDomainAddress();
    const { state: isToggleChecked, toggle } = useToggle(true);
    const isFeatureEnabled = !!addresses && hasShortDomain(addresses);

    const handleEnableFeature = async () => {
        if (isToggleChecked && !isFeatureEnabled) {
            try {
                await createShortDomainAddress({ setDefault: true, replaceAddressSignature: true });
                dispatch(featureTourActions.activateFeature({ feature: 'short-domain' }));
            } catch (error) {
                traceError(error, { tags: { initiative: SentryMailInitiatives.MAIL_ONBOARDING } });
            }
        }
    };

    return (
        <FeatureTourStepsContent
            bullets={props.bullets}
            illustrationSize="small"
            illustration={shortDomainImg}
            title={c('Title').t`Same inbox, shorter email address`}
            mainCTA={
                <FeatureTourStepCTA
                    type="primary"
                    onClick={() => {
                        void handleEnableFeature();
                        props.onNext();
                    }}
                >
                    {c('Action').t`Next`}
                </FeatureTourStepCTA>
            }
        >
            <p className="mt-0 mb-4">{c('Info').t`Start using the shorter, catchier version of your email address.`}</p>
            <FeatureTourToggle
                isFeatureEnabled={isFeatureEnabled}
                checked={isToggleChecked}
                onToggle={toggle}
                title={
                    <div className="text-left text-ellipsis">
                        {/* translator: Sentense is "Activate myshortDomain@pm.me" if short domain feature is not active. */}
                        {!isFeatureEnabled ? <div className="color-weak">{c('Action').t`Activate`}</div> : null}
                        <strong className="pr-4" title={shortDomainAddress}>
                            {shortDomainAddress}
                        </strong>
                    </div>
                }
            />
        </FeatureTourStepsContent>
    );
};

export default ShortDomainTourStep;
