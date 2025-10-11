import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { PassPlusIcon } from '@proton/pass/components/Upsell/PassPlusIcon';

import { CustomDomainsTable } from './CustomDomainsTable';
import { DefaultDomainSelect } from './DefaultDomainSelect';
import { useAliasDomains } from './DomainsProvider';

export const AliasDomains: FC = () => {
    const { canManage, setAction } = useAliasDomains();

    return (
        <SettingsPanel title={c('Label').t`Domains`} className="flex-1" contentClassname="pt-4 pb-2">
            <div className="text-bold mb-2">{c('Title').t`Select the default domain for aliases`}</div>
            <DefaultDomainSelect className="mb-6" />

            <div className="text-bold mb-2">{c('Title').t`Custom domains`}</div>
            <div>{c('Info')
                .t`Bring your own domain and you don't have to buy yet another email hosting solution.`}</div>
            <Button color="weak" shape="solid" className="my-2" onClick={() => setAction({ type: 'create' })}>
                {c('Action').t`Add custom domain`}
                {!canManage && <PassPlusIcon className="ml-2" />}
            </Button>
            <CustomDomainsTable />
        </SettingsPanel>
    );
};
