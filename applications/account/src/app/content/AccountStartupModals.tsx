import { useEffect, useRef } from 'react';

import {
    FeatureCode,
    getShouldOpenReferralModal,
    useApi,
    useAuthentication,
    useFeature,
    useModalState,
    useSubscription,
    useUser,
} from '@proton/components';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { APPS, APP_NAMES, OPEN_OFFER_MODAL_EVENT } from '@proton/shared/lib/constants';
import { getPlan } from '@proton/shared/lib/helpers/subscription';
import noop from '@proton/utils/noop';

import PassOnboardingModal from './PassOnboardingModal';

const AccountStartupModals = ({ app }: { app: APP_NAMES }) => {
    const authentication = useAuthentication();
    const api = useApi();
    const [user] = useUser();
    const silentApi = getSilentApi(api);
    const [subscription] = useSubscription();
    const seenReferralModal = useFeature<boolean>(FeatureCode.SeenReferralModal);
    const shouldOpenReferralModal = getShouldOpenReferralModal({ subscription, feature: seenReferralModal.feature });
    const seenPassSignupFeature = useFeature<boolean>(FeatureCode.PassSignup);
    const seenPassSignup = seenPassSignupFeature.feature?.Value;
    const [passOnboardingProps, setPassOnboardingModal, renderPassOnboardingModal] = useModalState();
    const onceRef = useRef(false);

    useEffect(() => {
        if (shouldOpenReferralModal.open) {
            document.dispatchEvent(new CustomEvent(OPEN_OFFER_MODAL_EVENT));
        }
    }, [shouldOpenReferralModal.open]);

    useEffect(() => {
        if (
            app !== APPS.PROTONPASS ||
            !subscription ||
            seenPassSignup === undefined ||
            seenPassSignup ||
            onceRef.current
        ) {
            return;
        }

        const getHasNotUsedPass = async () => {
            const result = await silentApi<{ Data: { ActivationTime: number } | null }>({
                url: 'pass/v1/user/access/check',
                method: 'GET',
            }).catch(noop);
            return result?.Data === null;
        };

        const run = async () => {
            if (await getHasNotUsedPass()) {
                onceRef.current = true;
                setPassOnboardingModal(true);
                seenPassSignupFeature.update(true).catch(noop);
            }
        };

        run().catch(noop);
    }, [seenPassSignup, subscription]);

    return (
        <>
            {renderPassOnboardingModal && (
                <PassOnboardingModal
                    user={user}
                    plan={getPlan(subscription)?.Name}
                    {...passOnboardingProps}
                    onClose={() => {
                        const params = new URLSearchParams();
                        params.set('u', `${authentication.localID}`);
                        params.set('mode', 'onboarding');
                        window.open(`${window.location.origin}/pass/signup?${params.toString()}`, '_self');
                        passOnboardingProps.onClose?.();
                    }}
                />
            )}
        </>
    );
};

export default AccountStartupModals;
