import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter } from '@proton/components/components';
import { ADDON_NAMES, PASS_APP_NAME, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
import { UserModel } from '@proton/shared/lib/interfaces';
import { hasPaidPass } from '@proton/shared/lib/user/helpers';

import { getHasBusinessUpsell, getHasUnlimitedUpsell } from '../single-signup-v2/helper';
import PassOnboardingVideo from './PassOnboardingVideo';

interface Props extends ModalProps {
    plan: PLANS | ADDON_NAMES | undefined;
    user: UserModel;
}

const PassOnboardingModal = ({ user, plan, ...rest }: Props) => {
    const br = <br key="br" />;
    const PASS_APP_NAME_2 = PASS_APP_NAME;

    return (
        <ModalTwo {...rest} disableCloseOnEscape={true} size="large">
            <ModalTwoContent>
                <div className="text-center">
                    <div className="mb-6 mt-8 rounded-xl overflow-hidden">
                        <PassOnboardingVideo />
                    </div>
                    <div className="mb-4 text-bold h3">
                        {c('pass_signup_2023: Info')
                            .jt`Discover ${PASS_APP_NAME},${br}our new encrypted password manager`}
                    </div>
                    <div className="mb-6 color-weak">
                        {(() => {
                            if (plan === undefined) {
                                return c('pass_signup_2023: Info')
                                    .t`${PASS_APP_NAME} keeps your passwords and identity secure with rigorous end-to-end encryption.`;
                            }

                            if (hasPaidPass(user)) {
                                return c('pass_signup_2023: Info')
                                    .t`${PASS_APP_NAME} keeps your passwords and identity secure with rigorous end-to-end encryption. Your current plan already gives you access to premium ${PASS_APP_NAME_2} features — no need to purchase again.`;
                            }

                            const unlimitedUpsell = getHasUnlimitedUpsell(plan);
                            const businessUpsell = getHasBusinessUpsell(plan);
                            if (unlimitedUpsell || businessUpsell) {
                                const upsellPlanName = unlimitedUpsell
                                    ? PLAN_NAMES[PLANS.BUNDLE]
                                    : PLAN_NAMES[PLANS.BUNDLE_PRO];
                                return c('pass_signup_2023: Info')
                                    .t`${PASS_APP_NAME} keeps your passwords and identity secure with rigorous end-to-end encryption. To add premium features of ${PASS_APP_NAME_2} to your current subscription, we suggest upgrading to the ${upsellPlanName} plan.`;
                            }
                        })()}
                    </div>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="norm" onClick={rest.onClose} fullWidth>
                    {(() => {
                        const appName = PASS_APP_NAME;
                        if (hasPaidPass(user)) {
                            return c('pass_signup_2023: Action').t`Start using ${appName} now`;
                        }
                        return c('pass_signup_2023: Action').t`Check out ${appName} features`;
                    })()}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default PassOnboardingModal;
