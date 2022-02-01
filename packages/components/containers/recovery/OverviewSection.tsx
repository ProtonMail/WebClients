import { useCanReactivateKeys } from '../../hooks';
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

    return (
        <>
            {canReactivateKeys && <RecoverDataCard className="mb2" />}
            <RecoveryCard ids={ids} />
        </>
    );
};

export default OverviewSection;
