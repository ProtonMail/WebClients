import { type KeyboardEvent, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button, CircleLoader, Href } from '@proton/atoms/index';
import { InputFieldTwo, Toggle } from '@proton/components/index';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { DomainMailboxesSelector } from '@proton/pass/components/Settings/Aliases/DomainMailboxesSelector';
import { type CustomDomainInfo } from '@proton/pass/components/Settings/Aliases/Domains';
import { SIMPLELOGIN_DOMAIN_SETTINGS_URL } from '@proton/pass/constants';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import {
    getCustomDomainSettings,
    updateCatchAll,
    updateCustomDomainDisplayName,
    updateCustomDomainMailboxes,
    updateRandomPrefix,
} from '@proton/pass/store/actions';
import type { CustomDomainOutput, CustomDomainSettingsOutput, MaybeNull } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

type Props = {
    domain: CustomDomainOutput;
    onUpdate?: (domain: CustomDomainInfo) => void;
};

export const DomainDetailsInfo = ({ domain }: Props) => {
    const [domainSettings, setDomainSettings] = useState<MaybeNull<CustomDomainSettingsOutput>>(null);
    const [selectedMailboxIDs, setSelectedMailboxIDs] = useState<number[]>([]);
    const [displayName, setDisplayName] = useState('');

    const onSuccess = ({ data }: { data: CustomDomainSettingsOutput }) => {
        setDomainSettings(data);
    };

    const toggleCatchAll = useRequest(updateCatchAll, { onSuccess });
    const updateMailboxes = useRequest(updateCustomDomainMailboxes, { onSuccess });
    const updateDisplayName = useRequest(updateCustomDomainDisplayName, { onSuccess });
    const toggleRandomPrefix = useRequest(updateRandomPrefix, { onSuccess });

    const handleToggleCatchAll = (enabled: boolean) => {
        toggleCatchAll.dispatch({ domainID: domain.ID, catchAll: enabled });
    };

    const handleUpdateMailboxes = () => {
        updateMailboxes.dispatch({ domainID: domain.ID, mailboxIDs: selectedMailboxIDs });
    };

    const handleSubmitDisplayName = () => {
        updateDisplayName.dispatch({ domainID: domain.ID, name: displayName });
    };

    const handleToggleRandomPrefixClick = (enabled: boolean) => {
        toggleRandomPrefix.dispatch({ domainID: domain.ID, randomPrefix: enabled });
    };

    const getDomainSettings = useRequest(getCustomDomainSettings, {
        onSuccess: ({ data }) => {
            setDomainSettings(data);
            setDisplayName(data.DefaultDisplayName ?? '');
            if (data?.Mailboxes) setSelectedMailboxIDs(data.Mailboxes.map(({ ID }) => ID));
        },
        onFailure: () => setDomainSettings(null),
    });

    const isDomainVerified = domain.OwnershipVerified;

    useEffect(() => {
        // BE won't return domain settings if domain is not verified
        if (isDomainVerified) getDomainSettings.dispatch(domain.ID);
    }, [domain.ID]);

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

    const emailBold = (
        <span className="text-bold" key="domain-details-email">{c('Email').t`anything@${domain.Domain}`}</span>
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
                .t`Default display name for aliases created with ${domain.Domain} unless overwritten by the alias display name.`}</div>

            <div className="flex gap-3 mt-2">
                <div>
                    <InputFieldTwo
                        value={displayName}
                        onValue={setDisplayName}
                        onKeyUp={(e: KeyboardEvent) => e.key === 'Enter' && handleSubmitDisplayName()}
                        placeholder={c('Placeholder').t`Alias Display Name`}
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
