import { type FC } from 'react';

import { c } from 'ttag';

import { SubHeader } from '@proton/pass/components/Layout/Section/SubHeader';
import { CustomAddressAddButton } from '@proton/pass/components/Monitor/Address/CustomAddressAddButton';
import { useMonitor } from '@proton/pass/components/Monitor/MonitorProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { useBreachesTable } from '@proton/pass/hooks/monitor/useBreachesTable';
import { AddressType } from '@proton/pass/lib/monitor/types';
import { epochToDateTime } from '@proton/pass/utils/time/format';
import headerBreachImg from '@proton/styles/assets/img/breach-alert/img-breaches-found.svg';
import headerNoBreachImg from '@proton/styles/assets/img/breach-alert/img-no-breaches-found.svg';

import { BreachGroupList } from './Group/BreachGroupList';

export const Breaches: FC = () => {
    const monitor = useMonitor();
    const refreshedAt = monitor.refreshedAt ? epochToDateTime(monitor.refreshedAt) : null;
    const proton = useBreachesTable(AddressType.PROTON);
    const alias = useBreachesTable(AddressType.ALIAS);
    const custom = useBreachesTable(AddressType.CUSTOM);

    return (
        <>
            <div className="flex flex-nowrap mb-3">
                <SubHeader
                    title={c('Title').t`Dark Web Monitoring`}
                    description={c('Description')
                        .t`Start monitoring for data breaches related to accounts created with your email address and your hide-my-email aliases.`}
                />
                <div className="hidden lg:block shrink-0 w-2/5">
                    <div className="relative w-full ratio-2/1">
                        <img
                            className="w-full h-full absolute object-contain"
                            src={monitor.breaches.count > 0 ? headerBreachImg : headerNoBreachImg}
                            alt=""
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-columns gap-6">
                <BreachGroupList
                    data={proton.data}
                    displayLimit={5}
                    title={`${proton.title} (${proton.data.length})`}
                    loading={proton.loading}
                    seeAllHref={getLocalPath(`monitor/dark-web/${AddressType.PROTON}`)}
                />

                <BreachGroupList
                    data={alias.data}
                    displayLimit={5}
                    title={`${alias.title} (${alias.data.length})`}
                    loading={alias.loading}
                    seeAllHref={getLocalPath(`monitor/dark-web/${AddressType.ALIAS}`)}
                />

                <BreachGroupList
                    data={custom.data}
                    displayLimit={5}
                    title={`${custom.title} (${custom.data.length})`}
                    loading={custom.loading}
                    seeAllHref={getLocalPath(`monitor/dark-web/${AddressType.CUSTOM}`)}
                    actions={<CustomAddressAddButton />}
                />

                {refreshedAt && <span className="text-sm color-weak">{c('Info').t`Last checked: ${refreshedAt}`}</span>}
            </div>
        </>
    );
};
