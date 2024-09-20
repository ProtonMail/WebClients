import { c } from 'ttag';

import { Scroll } from '@proton/atoms';
import { Tabs } from '@proton/components';

import { useAddresses } from '../..';
import BreachListItem from './BreachListItem';
import BreachListUpgradeLink from './BreachListUpgradeLink';
import EmptyBreachListCard from './EmptyBreachListCard';
import { getStyle } from './helpers';
import type { FetchedBreaches, ListType } from './models';
import { BREACH_STATE } from './models';

interface BreachesListProps {
    data: FetchedBreaches[];
    selectedID: string | null;
    onSelect: (id: string) => void;
    isPaidUser: boolean;
    total: number | null;
    type: ListType;
    onViewTypeChange: (type: ListType) => void;
}

const BreachesList = ({
    data,
    selectedID,
    isPaidUser,
    onSelect,
    total,
    type: listType,
    onViewTypeChange,
}: BreachesListProps) => {
    const [addresses] = useAddresses();
    const openBreaches = data?.filter((b) => b.resolvedState !== BREACH_STATE.RESOLVED);
    const resolvedBreaches = data?.filter((b) => b.resolvedState === BREACH_STATE.RESOLVED);

    const types: ListType[] = ['open', 'resolved'];
    const tabs = [
        {
            title: c('Title').t`Open`,
            content: (
                <Scroll className="lg:flex flex-column flex-nowrap lg:mr-2 mb-2 w-full h-full overflow-auto max-h-full">
                    {openBreaches.length === 0 ? (
                        <div className="flex lg:hidden">
                            <EmptyBreachListCard listType="open" className="w-full" />
                        </div>
                    ) : (
                        <ul className="unstyled m-0">
                            {openBreaches.map((breach) => {
                                return (
                                    <BreachListItem
                                        data={breach}
                                        key={breach.id}
                                        disabled={!isPaidUser}
                                        selected={breach.id === selectedID}
                                        handleClick={() => onSelect(breach.id)}
                                        style={getStyle(breach.severity)}
                                        unread={breach.resolvedState === BREACH_STATE.UNREAD}
                                        hasMultipleAddresses={addresses && addresses?.length > 1}
                                    />
                                );
                            })}
                        </ul>
                    )}

                    {!isPaidUser && total && <BreachListUpgradeLink total={total} />}
                </Scroll>
            ),
        },
        {
            title: c('Title').t`Resolved`,
            content: (
                <Scroll className="lg:flex flex-column flex-nowrap lg:mr-2 mb-2 w-full h-full overflow-auto max-h-full">
                    {resolvedBreaches.length === 0 ? (
                        <div className="flex lg:hidden">
                            <EmptyBreachListCard listType="resolved" className="w-full" />
                        </div>
                    ) : (
                        <ul className="unstyled m-0">
                            {resolvedBreaches.map((breach) => {
                                return (
                                    <BreachListItem
                                        data={breach}
                                        key={breach.id}
                                        disabled={!isPaidUser}
                                        selected={breach.id === selectedID}
                                        handleClick={() => onSelect(breach.id)}
                                        style={getStyle(breach.severity)}
                                        hasMultipleAddresses={addresses && addresses?.length > 1}
                                        resolved
                                    />
                                );
                            })}
                        </ul>
                    )}
                    {!isPaidUser && total && <BreachListUpgradeLink total={total} />}
                </Scroll>
            ),
        },
    ];

    return (
        <div className="w-full lg:w-1/3 lg:mr-4">
            <Tabs
                tabs={tabs}
                value={types.findIndex((type) => type === listType)}
                onChange={(index) => onViewTypeChange(types[index])}
                contentClassName="h-full"
                className="h-full flex flex-column flex-nowrap"
            />
        </div>
    );
};

export default BreachesList;
