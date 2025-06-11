import { type FC, useMemo, useRef } from 'react';

import { c } from 'ttag';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
} from '@proton/components';
import { getOccurrenceString } from '@proton/pass/lib/i18n/helpers';
import type { SelectedRevision } from '@proton/pass/types';

type Props = SelectedRevision & { vaultId: string };

export const MoreInfoDropdown: FC<Props> = ({ revision, itemId, shareId, vaultId }) => {
    const info = useMemo(
        () => [
            { label: c('Label').t`Modified`, values: [getOccurrenceString(revision - 1)] },
            { label: c('Label').t`Item ID`, values: [itemId] },
            { label: c('Label').t`Share ID`, values: [shareId] },
            { label: c('Label').t`Vault ID`, values: [vaultId] },
        ],
        [revision, itemId, shareId, vaultId]
    );

    const anchorRef = useRef<HTMLDivElement>(null);
    const handleClick = () => setTimeout(() => anchorRef?.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    return (
        <Collapsible>
            <CollapsibleHeader
                disableFullWidth
                onClick={handleClick}
                className="pt-2 text-sm"
                suffix={
                    <CollapsibleHeaderIconButton className="p-0" onClick={handleClick}>
                        <Icon name="chevron-down" className="color-weak" />
                    </CollapsibleHeaderIconButton>
                }
            >
                <span className="flex items-center color-weak text-semibold">
                    <Icon className="mr-2" name="info-circle" />
                    <span>{c('Button').t`More info`}</span>
                </span>
            </CollapsibleHeader>
            <CollapsibleContent className="color-weak pt-4 text-sm">
                {info.map(({ label, values }, idx) => (
                    <div
                        className="flex mb-2"
                        key={`${label}-${idx}`}
                        {...(idx === info.length - 1 ? { ref: anchorRef } : {})}
                    >
                        <div className="mr-6 text-right w-custom" style={{ '--w-custom': '5rem' }}>{`${label}:`}</div>
                        <div className="flex-1 text-break">
                            {values.map((value) => (
                                <div key={value}>{value}</div>
                            ))}
                        </div>
                    </div>
                ))}
            </CollapsibleContent>
        </Collapsible>
    );
};
