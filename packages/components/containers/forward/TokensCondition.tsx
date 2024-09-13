import { Fragment } from 'react';

import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';

import type { Condition } from '../filters/interfaces';

interface TokenProps {
    index: number;
    value: string;
    onRemove: (index: number) => void;
}

const Token = ({ index, value, onRemove }: TokenProps) => {
    return (
        <Fragment key={`${value}-${index}`}>
            {index > 0 && <span className="mx-2 text-sm mb-2">{c('email_forwarding_2023: Label').t`or`}</span>}
            <span className="inline-flex max-w-full flex-nowrap flex-row items-center mb-2 condition-token">
                <small className="text-ellipsis text-no-decoration" title={value}>
                    {value}
                </small>
                <button
                    type="button"
                    className="flex shrink-0 ml-2"
                    title={c('email_forwarding_2023: Action').t`Remove “${value}”`}
                    onClick={() => onRemove(index)}
                >
                    <Icon name="cross" size={2.75} />
                    <span className="sr-only">{c('email_forwarding_2023: Action').t`Remove “${value}”`}</span>
                </button>
            </span>
        </Fragment>
    );
};

interface Props {
    condition: Condition;
    onRemove: (index: number) => void;
}

const TokensCondition = ({ condition, onRemove }: Props) => {
    const renderToken = (token: string, i: number) => <Token key={i} index={i} value={token} onRemove={onRemove} />;
    return <div className="mb-4 flex items-center">{condition.values?.map(renderToken)}</div>;
};

export default TokensCondition;
