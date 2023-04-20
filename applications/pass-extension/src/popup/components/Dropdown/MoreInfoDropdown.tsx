import { type VFC, useRef } from 'react';

import { c } from 'ttag';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
} from '@proton/components';

type Props = {
    info: { label: string; values: string[] }[];
};

export const MoreInfoDropdown: VFC<Props> = ({ info }) => {
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
                <span className="flex flex-align-items-center color-weak text-semibold">
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
                        <div className="mr-6 text-right w80p">{`${label}:`}</div>
                        <div>
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
