import type { ReactNode } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import UpsellFeatureList from '@proton/components/components/upsell/UpsellFeatureList';
import type { UpsellFeatureName } from '@proton/components/components/upsell/constants';
import useConfig from '@proton/components/hooks/useConfig';
import type { Plan } from '@proton/payments';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getAbuseURL, getStaticURL, getTermsURL } from '@proton/shared/lib/helpers/url';
import accountLockedImage from '@proton/styles/assets/img/illustrations/account-locked.svg';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import type useUpsellConfig from '../config/useUpsellConfig';

interface AccountLockedUpsellFormProps {
    selectedPlan?: Plan;
    upsellConfig?: ReturnType<typeof useUpsellConfig>;
    handleUpgrade?: () => void;
    renderPlanSelect?: () => ReactNode;
}

const AccountLockedUpsellForm = ({
    selectedPlan,
    upsellConfig,
    handleUpgrade,
    renderPlanSelect,
}: AccountLockedUpsellFormProps) => {
    const { APP_NAME } = useConfig();
    const termsLink = <Href key="locale" href={getTermsURL(APP_NAME)}>{c('Link').t`terms of service`}</Href>;
    const contactLink = <Href key="contact" href={getAbuseURL()}>{c('Link').t`contact us`}</Href>;
    const enableUpgrade = [upsellConfig, handleUpgrade, renderPlanSelect].every(isTruthy);
    const features: UpsellFeatureName[] = enableUpgrade
        ? ['password-health', 'account-protection', 'storage-by-plan', 'address-by-plan']
        : [];
    const planTitle = selectedPlan?.Title ?? 'Plan';
    const mailLink = (
        <Href key="mail" href={getStaticURL('/mail')}>
            {MAIL_APP_NAME}
        </Href>
    );

    return (
        <div>
            <div className="text-center">
                <div className="mb-4">
                    <img
                        src={accountLockedImage}
                        className="block mx-auto w-custom"
                        style={{ '--w-custom': '6rem' }}
                        alt=""
                    />
                </div>
                <h1 className="h3 text-bold mb-4">
                    {c('Title').t`Account restricted`}
                    <div className="text-sm mt-1">
                        {c('Info').jt`Creating multiple free accounts is not permitted by our ${termsLink}.`}
                    </div>
                </h1>
                <div className="mb-4">
                    {c('Info')
                        .t`We have plans designed specifically for users like you who need more than one email address.`}
                    {enableUpgrade
                        ? c('Info').t`To remove restrictions, you can upgrade to a paid plan.`
                        : c('Info')
                              .jt`For additional information and to remove restrictions, please login at ${mailLink}.`}
                </div>
                {enableUpgrade && renderPlanSelect && <div className="py-2">{renderPlanSelect()}</div>}
            </div>
            {features.length > 0 && (
                <>
                    <div className="pt-4">
                        <UpsellFeatureList
                            className="mb-4"
                            features={features}
                            iconSize={5}
                            plan={selectedPlan}
                            odd={true}
                        />
                    </div>
                    {enableUpgrade && upsellConfig && (
                        <ButtonLike
                            as={upsellConfig.upgradePath ? SettingsLink : undefined}
                            path={upsellConfig.upgradePath || ''}
                            onClick={handleUpgrade}
                            color="norm"
                            size="large"
                            shape="solid"
                            disabled={!selectedPlan}
                            fullWidth
                            className="mt-2"
                        >
                            {c('new_plans: Action').t`Get ${planTitle}`}
                        </ButtonLike>
                    )}
                </>
            )}
            <div className={clsx('color-weak text-center', enableUpgrade ? 'mt-4' : 'mt-16')}>
                {c('Info').jt`If you believe we made a mistake, please ${contactLink}.`}
            </div>
        </div>
    );
};

export default AccountLockedUpsellForm;
