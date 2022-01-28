import { MutableRefObject } from 'react';
import { useCanReactivateKeys } from '../../hooks';
import RecoverDataCard from './RecoverDataCard';
import RecoveryCard from './RecoveryCard';

interface Props {
    openRecoverDataModalRef?: MutableRefObject<boolean>;
    ids: {
        account: string;
        data: string;
    };
}

const OverviewSection = ({ openRecoverDataModalRef, ids }: Props) => {
    const canReactivateKeys = useCanReactivateKeys();

    return (
        <>
            {canReactivateKeys && <RecoverDataCard className="mb2" openRecoverDataModalRef={openRecoverDataModalRef} />}
            <RecoveryCard ids={ids} />
        </>
    );
};

export default OverviewSection;
