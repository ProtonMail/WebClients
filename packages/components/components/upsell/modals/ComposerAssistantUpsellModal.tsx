import { useMember } from '@proton/account/member/hook';
import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import Loader from '@proton/components/components/loader/Loader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import ComposerAssistantB2BUpsellModal from '@proton/components/components/upsell/modals/ComposerAssistantB2BUpsellModal';
import ComposerAssistantB2CUpsellModal from '@proton/components/components/upsell/modals/ComposerAssistantB2CUpsellModal';
import { getIsB2CUserAbleToRunScribe } from '@proton/components/components/upsell/modals/ComposerAssistantUpsellModal.helpers';
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
