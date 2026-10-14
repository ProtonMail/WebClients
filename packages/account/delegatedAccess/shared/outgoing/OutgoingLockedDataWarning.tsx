import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { DashboardCard, DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import ReactivateKeysModal from '@proton/components/containers/keys/reactivateKeys/ReactivateKeysModal';
import lockSvg from '@proton/components/containers/recovery/recover-data-banner-lock.svg';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';

import { useInactiveKeys } from '../../../inactiveKeys/hooks';

/**
 * Users who chose "Don't show again" on the recovery overview's locked data banner told us their locked data
 * comes from an old password reset they don't care about, so we don't warn them here either.
 */
export const useShouldShowLockedDataWarning = () => {
    const hasInactiveKeys = useInactiveKeys().length > 0;
    const { feature: hasDismissedRecoverDataCard } = useFeature(FeatureCode.DismissedRecoverDataCard);
    return hasInactiveKeys && hasDismissedRecoverDataCard?.Value === false;
};

interface Props {
    title: string;
    description: string;
    onAddContact: () => void;
    addContactDisabled?: boolean;
}

export const OutgoingLockedDataWarning = ({ title, description, onAddContact, addContactDisabled }: Props) => {
    const keyReactivationRequests = useInactiveKeys();
    const [reactivateKeysModalProps, setReactivateKeysModalOpen, renderReactivateKeysModal] = useModalState();

    return (
        <DashboardCard>
            {renderReactivateKeysModal && (
                <ReactivateKeysModal keyReactivationRequests={keyReactivationRequests} {...reactivateKeysModalProps} />
            )}
            <DashboardCardContent className="flex flex-column md:flex-row md:flex-nowrap md:items-center gap-4">
                <div className="flex flex-nowrap items-start gap-3 md:flex-1">
                    <img src={lockSvg} width={32} height={32} alt="" className="shrink-0" />
                    <p className="m-0">
                        <span className="text-bold">{title}</span> {description}
                    </p>
                </div>
                <div className="flex flex-nowrap shrink-0 gap-2">
                    <Button shape="outline" disabled={addContactDisabled} onClick={onAddContact}>
                        {c('emergency_access').t`Add contact`}
                    </Button>
                    <Button color="norm" onClick={() => setReactivateKeysModalOpen(true)}>
                        {c('Action').t`Unlock data`}
                    </Button>
                </div>
            </DashboardCardContent>
        </DashboardCard>
    );
};
