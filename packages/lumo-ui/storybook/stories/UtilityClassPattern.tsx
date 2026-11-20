import { Fragment } from 'react';

export function UtilityClassPattern({ value }: { value: string }) {
    const segments = value.match(/[^,/]+[,/]?|[,/]/g) ?? [];

    return (
        <code className="ds-utility-table__pattern">
            {segments.map((segment, index) => (
                <Fragment key={index}>
                    {index > 0 && <wbr />}
                    <span>{segment}</span>
                </Fragment>
            ))}
        </code>
    );
}
