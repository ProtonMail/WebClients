import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { getHasVpnB2BPlan, isManagedExternally } from '@proton/shared/lib/helpers/subscription';

import { useModalState, useModalTwo } from '../../components/modalTwo';
import { useSubscription, useUser } from '../../hooks';
import { SettingsParagraph, SettingsSection } from '../account';
import CreditsModal from './CreditsModal';
import InAppPurchaseModal from './subscription/InAppPurchaseModal';

const CreditsSection = () => {
    const [subscription, loadingSubscription] = useSubscription();
    const [creditModalProps, setCreditModalOpen, renderCreditModal] = useModalState();
    const [externalSubscriptionModal, showExternalSubscriptionModal] = useModalTwo(InAppPurchaseModal);

    const [{ Credit }] = useUser();

    const hasVpnB2B = getHasVpnB2BPlan(subscription);

    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('Info')
                    .t`When your subscription renews, we will apply any available credits before we charge the payment method above.`}
            </SettingsParagraph>
            {hasVpnB2B ? null : (
                <div className="mb-7">
                    <Button
                        loading={loadingSubscription}
                        shape="outline"
                        onClick={() => {
                            if (isManagedExternally(subscription)) {
                                showExternalSubscriptionModal({ subscription, key: 'external-subscription-modal' });
                                return;
                            }

                            setCreditModalOpen(true);
                        }}
                    >{c('Action').t`Add credits`}</Button>
                </div>
            )}
            <div className="px-4 mb-4 flex flex-justify-space-between">
                <span className="text-bold" data-testid="unused-credits">{c('Credits').t`Available credits`}</span>
                <span className="text-bold" data-testid="avalaible-credits">
                    {Credit / 100}
                </span>
            </div>
            <hr />
            {renderCreditModal && <CreditsModal {...creditModalProps} />}
            {externalSubscriptionModal}
        </SettingsSection>
    );
};

export default CreditsSection;
