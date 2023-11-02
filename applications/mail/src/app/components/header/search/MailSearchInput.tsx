import { Ref, forwardRef, useRef } from 'react';

import { c } from 'ttag';

import { Button, Input } from '@proton/atoms';
import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

interface Props {
    onOpen: () => void;
    value: string;
    onChange: (newValue: string) => void;
    loading: boolean;
    adaptWidth: boolean;
}

const MailSearchInput = ({ value, onOpen, onChange, loading, adaptWidth }: Props, ref: Ref<HTMLInputElement>) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleClear = () => {
        onChange('');
        onOpen();
    };

    const handleFocus = () => {
        // Blur the input to avoid the focus to be triggered after search submission
        inputRef.current?.blur();
        onOpen();
    };

    return (
        <div className={clsx('searchbox flex pl-1', adaptWidth && 'searchbox--adaptWidth')} role="search">
            <div ref={ref} className="w-full m-auto">
                <Input
                    ref={inputRef}
                    inputClassName="cursor-text"
                    disabled={loading}
                    value={value}
                    placeholder={c('Placeholder').t`Search messages`}
                    onFocus={handleFocus}
                    data-testid="search-keyword"
                    readOnly
                    prefix={
                        <Button
                            type="submit"
                            icon
                            shape="ghost"
                            color="weak"
                            size="small"
                            className="rounded-sm no-pointer-events"
                            title={c('Action').t`Search`}
                            onClick={onOpen}
                            data-shorcut-target="searchbox-button"
                        >
                            <Icon name="magnifier" alt={c('Action').t`Search`} />
                        </Button>
                    }
                    suffix={
                        value.length ? (
                            <Button
                                type="button"
                                shape="ghost"
                                color="weak"
                                size="small"
                                className="rounded-sm"
                                title={c('Action').t`Clear search`}
                                onClick={handleClear}
                                data-testid="clear-button"
                            >
                                {c('Action').t`Clear`}
                            </Button>
                        ) : null
                    }
                />
            </div>
        </div>
    );
};

export default forwardRef(MailSearchInput);
