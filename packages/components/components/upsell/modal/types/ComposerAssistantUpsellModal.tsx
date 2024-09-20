import Loader from '@proton/components/components/loader/Loader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import ComposerAssistantB2BUpsellModal from '@proton/components/components/upsell/modal/types/ComposerAssistantB2BUpsellModal';
import ComposerAssistantB2CUpsellModal from '@proton/components/components/upsell/modal/types/ComposerAssistantB2CUpsellModal';
import { getIsB2CUserAbleToRunScribe } from '@proton/components/components/upsell/modal/types/ComposerAssistantUpsellModal.helpers';
import { useMember, useOrganization, useSubscription } from '@proton/components/hooks';
import { isOrganization, isSuperAdmin } from '@proton/shared/lib/organization/helper';

interface Props {
    modalProps: ModalStateProps;
}

const ComposerAssistantUpsellModal = ({ modalProps }: Props) => {
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrg] = useOrganization();
    const [member, loadingMember] = useMember();
    const isOrgUser = isOrganization(organization) && !isSuperAdmin(member ? [member] : []);

    // Depending on the user plan, show a different upsell modal
    // B2B users will be asked to buy Scribe addon and B2C users will be asked to upgrade to proton Duo
    const isB2CUser = getIsB2CUserAbleToRunScribe(subscription, organization, member);

    if (loadingOrg || loadingMember || loadingSubscription) {
        return <Loader />;
    }

    return (
        <>
            {isB2CUser ? (
                <ComposerAssistantB2CUpsellModal modalProps={modalProps} />
            ) : (
                <ComposerAssistantB2BUpsellModal modalProps={modalProps} isOrgUser={isOrgUser} />
            )}
        </>
    );
};

export default ComposerAssistantUpsellModal;
