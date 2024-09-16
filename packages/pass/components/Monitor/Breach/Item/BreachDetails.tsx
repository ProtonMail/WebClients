import { type FC, useMemo } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { c } from 'ttag';

import type { FetchedBreaches } from '@proton/components';
import { useAddressBreaches } from '@proton/pass/hooks/monitor/useAddressBreaches';
import type { MonitorAddress } from '@proton/pass/lib/monitor/types';
import type { Maybe } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import { BreachActions } from './BreachActions';
import { BreachList } from './BreachList';
import { BreachModal } from './BreachModal';
import { BreachUsageList } from './BreachUsageList';

export const BreachDetails: FC<MonitorAddress> = (address) => {
    const history = useHistory();
    const breachId = useParams<{ breachId?: string }>().breachId;
    const { active, resolved, usages, loading } = useAddressBreaches(address, address.email);
    const activeBreaches = active.length > 0;

    const selectedBreach = useMemo<Maybe<FetchedBreaches>>(
        () => active.find((breach) => breach.id === breachId) || resolved.find((breach) => breach.id === breachId),
        [breachId, active, resolved]
    );

    return (
        <>
            <header className="flex justify-space-between mb-6">
                <div className="flex items-center gap-4">
                    <div
                        style={{ '--w-custom': '2rem' }}
                        className={clsx(
                            activeBreaches ? 'bg-danger' : 'bg-success',
                            'flex items-center justify-center ratio-square rounded-50 text-bold w-custom'
                        )}
                    >
                        <span className="opacity-70">{active.length}</span>
                    </div>
                    <div className="flex flex-column">
                        <span className={clsx(activeBreaches ? 'color-danger' : 'color-success', 'text-bold')}>
                            {c('Title').t`Breaches detected for`}
                        </span>
                        <span className="block">{address.email}</span>
                    </div>
                </div>
                <BreachActions resolved={!activeBreaches} disabled={loading} {...address} />
            </header>

            <div className="flex flex-columns gap-6">
                <BreachList data={active} title={c('Title').t`Breaches`} loading={loading} />
                <BreachList data={resolved} title={c('Title').t`Resolved breaches`} loading={loading} />
                <BreachUsageList data={usages} />
            </div>

            {selectedBreach && <BreachModal breach={selectedBreach} onClose={history.goBack} key="breach-modal" />}
        </>
    );
};
