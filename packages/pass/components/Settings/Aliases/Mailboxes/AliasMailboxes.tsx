import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { PassPlusIcon } from '@proton/pass/components/Upsell/PassPlusIcon';

import { useAliasMailboxes } from './AliasMailboxesProvider';
import { AliasMailboxesTable } from './AliasMailboxesTable';

export const AliasMailboxes: FC = () => {
    const { canManage, setAction } = useAliasMailboxes();

    return (
        <SettingsPanel title={c('Label').t`Mailboxes`} contentClassname="pt-4 pb-2">
            <div>
                {c('Info')
                    .t`Emails sent to your aliases are forwarded to your mailboxes. An alias can have more than one mailbox: useful to share an alias between you and your friends.`}
            </div>

            <Button color="weak" shape="solid" className="my-2" onClick={() => setAction({ type: 'create' })}>
                {c('Action').t`Add mailbox`}
                {!canManage && <PassPlusIcon className="ml-2" />}
            </Button>

            <AliasMailboxesTable />
        </SettingsPanel>
    );
};
