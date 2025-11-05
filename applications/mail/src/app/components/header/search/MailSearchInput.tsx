import type { Ref } from 'react';
import { forwardRef, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import { IcMagnifier } from '@proton/icons';
import clsx from '@proton/utils/clsx';

interface Props {
    onOpen: () => void;
    value: string;
    onClearSearch: () => void;
    loading: boolean;
    adaptWidth: boolean;
}

const MailSearchInput = ({ value, onOpen, onClearSearch, loading, adaptWidth }: Props, ref: Ref<HTMLInputElement>) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleClear = () => {
        onClearSearch();
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
                            className="rounded-sm pointer-events-none"
                            title={c('Action').t`Search`}
                            onClick={onOpen}
                            data-shorcut-target="searchbox-button"
                        >
                            <IcMagnifier alt={c('Action').t`Search`} />
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
