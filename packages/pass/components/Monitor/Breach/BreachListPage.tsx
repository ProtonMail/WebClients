import { type FC } from 'react';

import { c } from 'ttag';

import { Scroll } from '@proton/atoms/Scroll';
import { SubHeader } from '@proton/pass/components/Layout/Section/SubHeader';
import { useMonitor } from '@proton/pass/components/Monitor/MonitorProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { useBreachesTable } from '@proton/pass/hooks/monitor/useBreachesTable';
import { AddressType } from '@proton/pass/lib/monitor/types';
import headerBreachImg from '@proton/styles/assets/img/breach-alert/img-breaches-found.svg';
import headerNoBreachImg from '@proton/styles/assets/img/breach-alert/img-no-breaches-found.svg';

import { BreachListGroup } from './BreachListGroup';

export const BreachListPage: FC = () => {
    const monitor = useMonitor();
    const proton = useBreachesTable(AddressType.PROTON);
    const alias = useBreachesTable(AddressType.ALIAS);
    const custom = useBreachesTable(AddressType.CUSTOM);

    return (
        <Scroll className="flex-1 w-full">
            <div className="h-full gap-4 max-w-custom pt-6 px-6" style={{ '--max-w-custom': '80em' }}>
                <div className="flex flex-nowrap">
                    <SubHeader
                        title={c('Title').t`Dark Web Monitoring`}
                        description={c('Description')
                            .t`Start monitoring for data breaches related to accounts created with your email address and your hide-my-email aliases.`}
                    />
                    <div className="hidden lg:flex shrink-0 justify-end w-1/2">
                        <img
                            className="w-full"
                            src={monitor.breaches.count > 0 ? headerBreachImg : headerNoBreachImg}
                            alt=""
                        />
                    </div>
                </div>

                <div className="flex flex-columns gap-6">
                    {proton.data.length > 0 && (
                        <BreachListGroup
                            data={proton.data}
                            groupName={`${proton.title} (${proton.data.length})`}
                            seeAllHref={getLocalPath(`monitor/dark-web/${AddressType.PROTON}`)}
                            displayLimit={4}
                        />
                    )}

                    {alias.data.length > 0 && (
                        <BreachListGroup
                            data={alias.data}
                            groupName={`${alias.title} (${alias.data.length})`}
                            seeAllHref={getLocalPath(`monitor/dark-web/${AddressType.ALIAS}`)}
                            displayLimit={4}
                        />
                    )}

                    {custom.data.length > 0 && (
                        <BreachListGroup
                            data={custom.data}
                            groupName={`${custom.title} (${custom.data.length})`}
                            seeAllHref={getLocalPath(`monitor/dark-web/${AddressType.CUSTOM}`)}
                            displayLimit={4}
                        />
                    )}
                </div>
            </div>
        </Scroll>
    );
};
