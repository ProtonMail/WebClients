import type { FC } from 'react';

import { c } from 'ttag';

import {
    BorderedContainer,
    BorderedContainerItem,
} from '@proton/components/components/BorderedStackedGroup/BorderedContainer';
import Copy from '@proton/components/components/button/Copy';
import useNotifications from '@proton/components/hooks/useNotifications';
import { IcCheckmarkCircle } from '@proton/icons/icons/IcCheckmarkCircle';
import { IcExclamationCircle } from '@proton/icons/icons/IcExclamationCircle';
import capitalize from '@proton/utils/capitalize';

export type DNSGroup = {
    name: 'verification' | 'SPF' | 'DMARC' | 'DKIM' | 'MX';
    records: {
        host?: string;
        priority?: number;
        dnsType: string;
        value: string;
        state: 'valid' | 'invalid' | 'not-found';
    }[];
};

const DNSGroupRecords: FC<{ group: DNSGroup }> = ({ group }) => {
    const { createNotification } = useNotifications();
    const handleCopy = () => createNotification({ text: c('Success').t`Value copied to clipboard` });
    const hostDefaultValue = c('Label for domain setup').t`Use default value`;
    const capitalizedGroup = capitalize(group.name);

    return (
        <>
            {group.records.map((r, ix) => (
                <BorderedContainer key={ix} className="mb-4 mt-2">
                    {/* Host */}
                    <BorderedContainerItem className="flex flex-row flex-nowrap items-center gap-2">
                        <span className="text-semibold">{c('Label for domain setup').t`Host name`}</span>
                        <span className="color-weak flex-1 text-ellipsis" title={r.host || hostDefaultValue}>
                            {r.host || hostDefaultValue}
                        </span>
                        {Boolean(r.host) && (
                            <Copy
                                onCopy={handleCopy}
                                shape="ghost"
                                size="small"
                                className="shrink-0 color-primary"
                                value={r.host!}
                            />
                        )}
                    </BorderedContainerItem>

                    {/* Value */}
                    <BorderedContainerItem className="flex flex-row flex-nowrap items-center gap-2">
                        <span className="text-semibold">
                            {c('Label for domain setup').t`Type`} {r.dnsType}
                        </span>
                        <span className="color-weak flex-1 text-ellipsis" title={r.value}>
                            {r.value}
                        </span>
                        <Copy
                            onCopy={handleCopy}
                            shape="ghost"
                            size="small"
                            className="shrink-0 color-primary"
                            value={r.value}
                        />
                    </BorderedContainerItem>

                    {/* Validation */}
                    {r.state === 'invalid' && (
                        <BorderedContainerItem className="flex flex-row flex-nowrap items-center gap-2">
                            <span className="color-danger inline-flex flex-nowrap items-top gap-1">
                                <IcExclamationCircle className="shrink-0 mt-0.5" />
                                {c('Label for domain setup').t`Invalid ${group.name} record found`}
                            </span>
                        </BorderedContainerItem>
                    )}

                    {r.state === 'not-found' && (
                        <BorderedContainerItem className="flex flex-row flex-nowrap items-center gap-2">
                            <span className="color-danger inline-flex flex-nowrap items-top gap-1">
                                <IcExclamationCircle className="shrink-0 mt-0.5" />
                                {c('Label for domain setup').t`${capitalizedGroup} record not found`}
                            </span>
                        </BorderedContainerItem>
                    )}

                    {r.state === 'valid' && (
                        <BorderedContainerItem className="flex flex-row flex-nowrap items-center gap-2">
                            <span className="color-success inline-flex flex-nowrap items-top gap-1">
                                <IcCheckmarkCircle className="shrink-0 mt-0.5" />
                                {c('Label for domain setup').t`Valid ${group.name} record found`}
                            </span>
                        </BorderedContainerItem>
                    )}
                </BorderedContainer>
            ))}
        </>
    );
};

export default DNSGroupRecords;
