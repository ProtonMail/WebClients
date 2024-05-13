export const multilineStrToMultilineJsx = (str: string, prefix = 'multiline-str') =>
    str
        .split('\n')
        .reduce(
            (acc: React.JSX.Element[], cur, index) => [
                ...acc,
                cur ? <span key={`${prefix}-${index}`}>{cur}</span> : <br key={`${prefix}-${index}`} />,
            ],
            [] as React.JSX.Element[]
        );
