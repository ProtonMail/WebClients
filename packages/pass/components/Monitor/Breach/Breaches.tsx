import { type FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/index';
import { SubHeader } from '@proton/pass/components/Layout/Section/SubHeader';
import { useMonitor } from '@proton/pass/components/Monitor/MonitorProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { useBreachesTable } from '@proton/pass/hooks/monitor/useBreachesTable';
import { AddressType } from '@proton/pass/lib/monitor/types';
import headerBreachImg from '@proton/styles/assets/img/breach-alert/img-breaches-found.svg';
import headerNoBreachImg from '@proton/styles/assets/img/breach-alert/img-no-breaches-found.svg';

import { BreachGroupList } from './Group/BreachGroupList';

export const Breaches: FC = () => {
    const monitor = useMonitor();
    const proton = useBreachesTable(AddressType.PROTON);
    const alias = useBreachesTable(AddressType.ALIAS);
    const custom = useBreachesTable(AddressType.CUSTOM);

    return (
        <>
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
                <BreachGroupList
                    data={proton.data}
                    displayLimit={4}
                    title={`${proton.title} (${proton.data.length})`}
                    loading={proton.loading}
                    seeAllHref={getLocalPath(`monitor/dark-web/${AddressType.PROTON}`)}
                />

                <BreachGroupList
                    data={alias.data}
                    displayLimit={4}
                    title={`${alias.title} (${alias.data.length})`}
                    loading={alias.loading}
                    seeAllHref={getLocalPath(`monitor/dark-web/${AddressType.ALIAS}`)}
                />

                <BreachGroupList
                    data={custom.data}
                    displayLimit={4}
                    title={`${custom.title} (${custom.data.length})`}
                    loading={custom.loading}
                    seeAllHref={getLocalPath(`monitor/dark-web/${AddressType.CUSTOM}`)}
                    actions={
                        <Button icon pill size="small" shape="solid" color="weak" onClick={() => monitor.addAddress()}>
                            <Icon name="plus" />
                        </Button>
                    }
                />
            </div>
        </>
    );
};
