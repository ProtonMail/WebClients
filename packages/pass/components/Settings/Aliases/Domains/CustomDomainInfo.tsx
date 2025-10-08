import { type KeyboardEvent, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Href } from '@proton/atoms/Href/Href';
import Toggle from '@proton/components/components/toggle/Toggle';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { DomainMailboxesSelector } from '@proton/pass/components/Settings/Aliases/Mailboxes/AliasMailboxesSelect';
import { SIMPLELOGIN_DOMAIN_SETTINGS_URL } from '@proton/pass/constants';
import { useRequest } from '@proton/pass/hooks/useRequest';
import {
    getCustomDomainSettings,
    updateCatchAll,
    updateCustomDomainDisplayName,
    updateCustomDomainMailboxes,
    updateRandomPrefix,
} from '@proton/pass/store/actions';
import type { CustomDomainSettingsOutput, MaybeNull } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import { useCustomDomain } from './DomainsProvider';

type Props = { domainID: number };

export const DomainDetailsInfo = ({ domainID }: Props) => {
    const domain = useCustomDomain(domainID);
    const isDomainVerified = domain?.OwnershipVerified;

    const [domainSettings, setDomainSettings] = useState<MaybeNull<CustomDomainSettingsOutput>>(null);
    const [selectedMailboxIDs, setSelectedMailboxIDs] = useState<number[]>([]);
    const [displayName, setDisplayName] = useState('');

    const toggleCatchAll = useRequest(updateCatchAll, { onSuccess: setDomainSettings });
    const updateMailboxes = useRequest(updateCustomDomainMailboxes, { onSuccess: setDomainSettings });
    const updateDisplayName = useRequest(updateCustomDomainDisplayName, { onSuccess: setDomainSettings });
    const toggleRandomPrefix = useRequest(updateRandomPrefix, { onSuccess: setDomainSettings });

    const handleToggleCatchAll = (catchAll: boolean) => toggleCatchAll.dispatch({ domainID, catchAll });
    const handleUpdateMailboxes = () => updateMailboxes.dispatch({ domainID, mailboxIDs: selectedMailboxIDs });
    const handleSubmitDisplayName = () => updateDisplayName.dispatch({ domainID, name: displayName });
    const handleToggleRandomPrefixClick = (randomPrefix: boolean) =>
        toggleRandomPrefix.dispatch({ domainID, randomPrefix });

    const getDomainSettings = useRequest(getCustomDomainSettings, {
        onSuccess: (data) => {
            setDomainSettings(data);
            setDisplayName(data.DefaultDisplayName ?? '');
            if (data?.Mailboxes) setSelectedMailboxIDs(data.Mailboxes.map(({ ID }) => ID));
        },
        onFailure: () => setDomainSettings(null),
    });

    useEffect(() => {
        /* BE won't return domain settings if domain is not verified */
        if (domain?.OwnershipVerified) getDomainSettings.dispatch(domain.ID);
    }, [domain]);

    const mailboxesSelectorUntouched =
        selectedMailboxIDs.length === (domainSettings?.Mailboxes?.length ?? 0) &&
        selectedMailboxIDs.every((id) => domainSettings?.Mailboxes?.some((mailbox) => mailbox.ID === id));

    const rulesHyperLink = (
        <Href href={SIMPLELOGIN_DOMAIN_SETTINGS_URL} key="domain-details-sl">
            {
                // translator: rules to decide when to automatically create an email alias
                c('Link').t`auto create rules ››`
            }
        </Href>
    );

    const domainDisplay = domain?.Domain ?? c('Info').t`your domain`;

    const emailBold = (
        <span className="text-bold" key="domain-details-email">{c('Email').t`anything@${domainDisplay}`}</span>
    );
    const automaticallyBold = (
        <span className="text-bold" key="domain-details-automatically">{c('Info').t`automatically`}</span>
    );

    const placeholder = isDomainVerified ? (
        <div className="flex items-center justify-center">
            <CircleLoader />
        </div>
    ) : (
        <Card type="primary">{c('Info')
            .t`You will be able to customize your domain settings (catch-all email aliases, default display name for aliases etc...) after verifying your domain.`}</Card>
    );

    return domainSettings ? (
        <div className="pb-8">
            <h5 className="text-bold mb-3">{c('Title').t`Auto create/on the fly alias`}</h5>
            <div className="flex items-center justify-space-between mb-3">
                <label htmlFor="catch-all">
                    {
                        // translator: Label for email "catch-all" setting toggle
                        c('Label').t`Catch-All`
                    }
                </label>
                <Toggle
                    id="catch-all"
                    checked={domainSettings.CatchAll}
                    onChange={(e) => handleToggleCatchAll(e.target.checked)}
                    loading={toggleCatchAll.loading}
                />
            </div>
            <div className={clsx(!domainSettings.CatchAll && 'color-weak')}>
                <div className="mb-1">
                    {c('Info')
                        .jt`Simply use ${emailBold} next time you need an alias: it'll be ${automaticallyBold} created the first time it receives an email. To have more fine-grained control, you can also define ${rulesHyperLink}.`}
                </div>
                <div className="mb-3">{c('Info')
                    .t`Auto-created aliases are automatically owned by the following mailbox(es):`}</div>
            </div>
            <div className="flex items-center flex-nowrap gap-3">
                <DomainMailboxesSelector
                    values={selectedMailboxIDs}
                    disabled={!domainSettings.CatchAll}
                    onChange={setSelectedMailboxIDs}
                />
                <Button
                    color="weak"
                    shape="solid"
                    loading={updateMailboxes.loading}
                    disabled={!domainSettings.CatchAll || mailboxesSelectorUntouched}
                    onClick={handleUpdateMailboxes}
                >
                    {c('Action').t`Update`}
                </Button>
            </div>
            <hr className="my-5" />

            <h5 className="text-bold mb-3">{c('Title').t`Default Display Name`}</h5>
            <div>{c('Info')
                .t`Default display name for aliases created with ${domainDisplay} unless overwritten by the alias display name.`}</div>

            <div className="flex gap-3 mt-2">
                <div>
                    <InputFieldTwo
                        value={displayName}
                        onValue={setDisplayName}
                        onKeyUp={(e: KeyboardEvent) => e.key === 'Enter' && handleSubmitDisplayName()}
                        placeholder={c('Placeholder').t`Alias Display Name`}
                        data-protonpass-ignore={true}
                        dense
                    />
                </div>
                <Button
                    color="weak"
                    shape="solid"
                    disabled={updateDisplayName.loading || displayName === domainSettings.DefaultDisplayName}
                    loading={updateDisplayName.loading}
                    onClick={handleSubmitDisplayName}
                >{c('Action').t`Save`}</Button>
            </div>
            <hr className="my-5" />

            <h5 className="text-bold mb-3">{c('Title').t`Random Prefix Generation`}</h5>
            <div className="flex items-center justify-space-between">
                <label htmlFor="random-prefix">
                    {c('Label').t`Add a random prefix for this domain when creating a new alias.`}
                </label>
                <Toggle
                    id="random-prefix"
                    checked={domainSettings.RandomPrefixGeneration}
                    onChange={(e) => handleToggleRandomPrefixClick(e.target.checked)}
                    loading={toggleRandomPrefix.loading}
                />
            </div>
        </div>
    ) : (
        <div className="min-h-custom mt-4" style={{ '--min-h-custom': '400px' }}>
            {placeholder}
        </div>
    );
};
