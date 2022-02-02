import { useState } from 'react';
import { useCanReactivateKeys, useFeature } from '../../hooks';
import { FeatureCode } from '../features/FeaturesContext';
import RecoverDataConfirmModal from './RecoverDataConfirmModal';
import RecoverDataCard from './RecoverDataCard';
import RecoveryCard from './RecoveryCard';

interface Props {
    ids: {
        account: string;
        data: string;
    };
}

const OverviewSection = ({ ids }: Props) => {
    const canReactivateKeys = useCanReactivateKeys();

    const [dismissConfirmModalOpen, setDismissConfirmModalOpen] = useState(false);

    const { feature: hasDismissedRecoverDataCard } = useFeature(FeatureCode.DismissedRecoverDataCard);

    return (
        <>
            <RecoverDataConfirmModal open={dismissConfirmModalOpen} onClose={() => setDismissConfirmModalOpen(false)} />
            {canReactivateKeys && hasDismissedRecoverDataCard?.Value === false && (
                <RecoverDataCard className="mb2" onDismiss={() => setDismissConfirmModalOpen(true)} />
            )}
            <RecoveryCard ids={ids} />
        </>
    );
};

export default OverviewSection;
