import { Scroll } from '@proton/atoms/Scroll';

import BreachListItem from './BreachListItem';
import BreachListUpgradeLink from './BreachListUpgradeLink';
import { FetchedBreaches } from './CredentialLeakSection';
import { getStyle } from './helpers';

interface BreachesListProps {
    breachData: FetchedBreaches[] | null;
    selectedID: string | null;
    setSelectedBreachID: (id: string) => void;
    isPaidUser: boolean;
    total: number | null;
    setOpenModal: (bool: boolean) => void;
}

const BreachesList = ({
    breachData,
    selectedID,
    isPaidUser,
    setSelectedBreachID,
    total,
    setOpenModal,
}: BreachesListProps) => {
    if (!breachData) {
        return;
    }
    return (
        <Scroll
            className="flex *:min-size-auto flex-column flex-nowrap gap-2 mr-2 w-full md:w-1/3 overflow-auto  md:h-auto mb-2"
            style={{ '--h-custom': '12rem' }}
        >
            {breachData.map((breach) => {
                return (
                    <ul className="unstyled m-0" key={breach.id}>
                        <BreachListItem
                            name={breach.name}
                            key={breach.id}
                            createdAt={breach.createdAt}
                            disabled={!isPaidUser}
                            selected={breach.id === selectedID}
                            handleClick={() => {
                                setSelectedBreachID(breach.id);
                                setOpenModal(true);
                            }}
                            style={getStyle(breach.severity)}
                        />
                    </ul>
                );
            })}
            {!isPaidUser && total && <BreachListUpgradeLink total={total} />}
        </Scroll>
    );
};

export default BreachesList;
