import { type FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Scroll } from '@proton/atoms/Scroll';
import { Icon } from '@proton/components/index';
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
    const didLoad = monitor.refreshedAt !== null;
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
                    <BreachListGroup
                        data={proton.data}
                        displayLimit={4}
                        groupName={`${proton.title} (${proton.data.length})`}
                        loading={!didLoad && proton.loading}
                        seeAllHref={getLocalPath(`monitor/dark-web/${AddressType.PROTON}`)}
                    />

                    <BreachListGroup
                        data={alias.data}
                        displayLimit={4}
                        groupName={`${alias.title} (${alias.data.length})`}
                        loading={!didLoad}
                        seeAllHref={getLocalPath(`monitor/dark-web/${AddressType.ALIAS}`)}
                    />

                    <BreachListGroup
                        data={custom.data}
                        displayLimit={4}
                        groupName={`${custom.title} (${custom.data.length})`}
                        loading={!didLoad && custom.loading}
                        seeAllHref={getLocalPath(`monitor/dark-web/${AddressType.CUSTOM}`)}
                        actions={
                            <Button
                                icon
                                pill
                                size="small"
                                shape="solid"
                                color="weak"
                                onClick={() => monitor.addAddress()}
                            >
                                <Icon name="plus" />
                            </Button>
                        }
                    />
                </div>
            </div>
        </Scroll>
    );
};
