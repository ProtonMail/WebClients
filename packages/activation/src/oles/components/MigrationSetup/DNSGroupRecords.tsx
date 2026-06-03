import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import {
    BorderedContainer,
    BorderedContainerItem,
} from '@proton/components/components/BorderedStackedGroup/BorderedContainer';
import Copy from '@proton/components/components/button/Copy';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { IcCheckmarkCircle } from '@proton/icons/icons/IcCheckmarkCircle';
import { IcExclamationCircle } from '@proton/icons/icons/IcExclamationCircle';
import capitalize from '@proton/utils/capitalize';

export type DNSGroup = {
    name: 'verification' | 'SPF' | 'DMARC' | 'DKIM' | 'MX';
    hideState?: boolean;
    records: {
        host?: string;
        priority?: number;
        dnsType: string;
        value: string;
        state: 'valid' | 'invalid' | 'not-found';
    }[];
};

const DNSGroupRecords: FC<{ group: DNSGroup; onRefresh?: () => Promise<void> }> = ({ group, onRefresh }) => {
    const { createNotification } = useNotifications();
    const handleCopy = () => createNotification({ text: c('Success').t`Value copied to clipboard` });
    const hostDefaultValue = c('Label for domain setup').t`Use default value (e.g. “@”)`;
    const capitalizedGroup = capitalize(group.name);
    const [{ state }] = group.records;
    const [loading, withLoading] = useLoading();

    return (
        <>
            {group.records.map((r, ix) => (
                <BorderedContainer key={ix} className="mb-4 mt-2">
                    {/* Host */}
                    <BorderedContainerItem
                        className="flex flex-row flex-nowrap items-center gap-2"
                        paddingClassName="py-0.5 px-5"
                    >
                        <span className="text-semibold w-1/6 min-w-custom" style={{ '--min-w-custom': '6rem' }}>{c(
                            'Label for domain setup'
                        ).t`Host name`}</span>
                        <span className="color-weak flex-1 text-ellipsis py-3" title={r.host || hostDefaultValue}>
                            {r.host || hostDefaultValue}
                        </span>
                        {Boolean(r.host) && (
                            <Copy
                                onCopy={handleCopy}
                                shape="ghost"
                                size="small"
                                color="norm"
                                className="shrink-0"
                                value={r.host!}
                            />
                        )}
                    </BorderedContainerItem>

                    {/* Value */}
                    <BorderedContainerItem
                        className="flex flex-row flex-nowrap items-center gap-2"
                        paddingClassName="py-0.5 px-5"
                    >
                        <span className="text-semibold w-1/6 min-w-custom" style={{ '--min-w-custom': '6rem' }}>
                            {c('Label for domain setup').t`Type`} {r.dnsType}
                        </span>
                        <span className="color-weak flex-1 text-ellipsis py-3" title={r.value}>
                            {r.value}
                        </span>
                        <Copy
                            onCopy={handleCopy}
                            shape="ghost"
                            size="small"
                            color="norm"
                            className="shrink-0"
                            value={r.value}
                        />
                    </BorderedContainerItem>

                    {/* Priority */}
                    {r.priority !== undefined && (
                        <BorderedContainerItem
                            className="flex flex-row flex-nowrap items-center gap-2"
                            paddingClassName="py-0.5 px-5"
                        >
                            <span className="text-semibold w-1/6 min-w-custom" style={{ '--min-w-custom': '6rem' }}>{c(
                                'Label for domain setup'
                            ).t`Priority`}</span>
                            <span className="color-weak flex-1 text-ellipsis py-3">{r.priority}</span>
                        </BorderedContainerItem>
                    )}
                </BorderedContainer>
            ))}

            {/* Validation */}
            {!group.hideState && (
                <>
                    <p className="my-6 color-weak">{c('BOSS')
                        .t`It can take up to 24 hours for these changes to propagate.`}</p>

                    <BorderedContainer>
                        <BorderedContainerItem
                            className="flex flex-row flex-nowrap items-center gap-2"
                            paddingClassName="py-0.5 px-5"
                        >
                            <span className="text-semibold w-1/6 min-w-custom" style={{ '--min-w-custom': '6rem' }}>{c(
                                'Label for domain setup'
                            ).t`Status`}</span>
                            {state === 'invalid' && (
                                <span className="color-danger inline-flex flex-nowrap items-top gap-1 py-3">
                                    <IcExclamationCircle className="shrink-0 mt-0.5" />
                                    {c('Label for domain setup').t`Invalid ${group.name} record found`}
                                </span>
                            )}

                            {state === 'not-found' && (
                                <span className="color-danger inline-flex flex-nowrap items-top gap-1 py-3">
                                    <IcExclamationCircle className="shrink-0 mt-0.5" />
                                    {c('Label for domain setup').t`${capitalizedGroup} record not found`}
                                </span>
                            )}

                            {state === 'valid' && (
                                <span className="color-success inline-flex flex-nowrap items-top gap-1 py-3">
                                    <IcCheckmarkCircle className="shrink-0 mt-0.5" />
                                    {c('Label for domain setup').t`Valid ${group.name} record found`}
                                </span>
                            )}

                            {onRefresh && (
                                <Button
                                    color="norm"
                                    shape="ghost"
                                    size="small"
                                    className="ml-auto"
                                    loading={loading}
                                    onClick={() => withLoading(onRefresh())}
                                >
                                    {c('BOSS').t`Refresh`}
                                </Button>
                            )}
                        </BorderedContainerItem>
                    </BorderedContainer>
                </>
            )}
        </>
    );
};

export default DNSGroupRecords;
