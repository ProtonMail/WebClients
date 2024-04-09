import { useState } from 'react';

import { c } from 'ttag';

import { Scroll } from '@proton/atoms/Scroll';

import { Tabs } from '../..';
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
    const [index, setIndex] = useState(0);

    if (!breachData) {
        return;
    }

    const tabs = [
        {
            title: c('Title').t`Open`,
            content: (
                <Scroll className="lg:flex flex-column flex-nowrap lg:mr-2 mb-2 w-full h-full overflow-auto max-h-full">
                    <ul className="unstyled m-0">
                        {breachData.map((breach) => {
                            return (
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
                                    severity={breach.severity}
                                    exposedData={breach.exposedData}
                                />
                            );
                        })}
                    </ul>
                    {!isPaidUser && total && <BreachListUpgradeLink total={total} />}
                </Scroll>
            ),
        },
        {
            title: c('Title').t`Resolved`,
            content: (
                <>
                    <p>{c('Info').t`Will soon be available.`}</p>
                </>
            ),
        },
    ];

    return (
        <div className="w-full lg:w-1/3 lg:mr-4">
            <Tabs
                tabs={tabs}
                value={index}
                onChange={setIndex}
                contentClassName="lg:flex-1 h-full"
                className="h-full flex flex-column flex-nowrap"
            />
        </div>
    );
};

export default BreachesList;
