import type { JSX } from 'react';

export const multilineStrToOnelineJsx = (str: string, prefix = 'oneline-str') =>
    str.split('\n').reduce(
        (acc: JSX.Element[], cur, index) => [
            ...acc,
            cur ? (
                <span key={`${prefix}-${index}`}>{cur}</span>
            ) : (
                <span key={`${prefix}-${index}`} className="text-pre">
                    {' '}
                </span>
            ),
        ],
        [] as JSX.Element[]
    );

export const formatReadableNameAndEmail = (name: string, email: string) => {
    return (
        <>
            {name}{' '}
            <span className="color-weak">
                {'<'}
                {email}
                {'>'}
            </span>
        </>
    );
};
