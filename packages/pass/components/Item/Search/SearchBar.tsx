import { type VFC, memo, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button, Input } from '@proton/atoms';
import { Icon } from '@proton/components/components';
import usePrevious from '@proton/hooks/usePrevious';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { getItemTypeOptions } from '@proton/pass/components/Item/Filters/Type';
import { useDebouncedValue } from '@proton/pass/hooks/useDebouncedValue';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import { selectShare } from '@proton/pass/store/selectors';
import type { ItemFilters, ShareType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';

import './SearchBar.scss';

type Props = {
    disabled?: boolean;
    filters: ItemFilters;
    trash?: boolean;
    onChange: (value: string) => void;
};

const SEARCH_DEBOUNCE_TIME = 150;

const SearchBarRaw: VFC<Props> = ({ disabled, filters, trash, onChange }) => {
    const { onTelemetry } = usePassCore();
    const [search, setSearch] = useState<string>(filters.search ?? '');
    const searchRef = usePrevious(search);
    const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_TIME);

    const inputRef = useRef<HTMLInputElement>(null);
    const { selectedShareId, type = '*' } = filters;

    const vault = useSelector(selectShare<ShareType.Vault>(selectedShareId));

    const placeholder = useMemo(() => {
        const ITEM_TYPE_TO_LABEL_MAP = getItemTypeOptions();
        const pluralItemType = ITEM_TYPE_TO_LABEL_MAP[type].label.toLowerCase();

        switch (type) {
            case '*':
                return vault
                    ? c('Placeholder').t`Search in ${vault.content.name}`
                    : c('Placeholder').t`Search in all vaults`;
            default: {
                // translator: ${pluralItemType} can be either "logins", "notes", "aliases", or "cards". Full sentence example: "Search notes in all vaults"
                return vault
                    ? c('Placeholder').t`Search ${pluralItemType} in ${vault.content.name}`
                    : c('Placeholder').t`Search ${pluralItemType} in all vaults`;
            }
        }
    }, [vault, type]);

    const handleClear = () => {
        setSearch('');
        onChange('');
        inputRef.current?.focus();
    };

    const handleFocus = () => inputRef.current?.select();

    const handleBlur = () => {
        if (isEmptyString(search)) return;
        void onTelemetry(createTelemetryEvent(TelemetryEventName.SearchTriggered, {}, {}));
    };

    useEffect(() => handleFocus(), []);
    useEffect(() => onChange(debouncedSearch), [debouncedSearch]);

    useEffect(() => {
        if (!filters.search) setSearch('');
        if (filters.search !== searchRef) onChange(search);
    }, [filters.search]);

    return (
        <Input
            autoFocus
            className="pass-searchbar"
            disabled={disabled}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onValue={setSearch}
            placeholder={`${trash ? c('Placeholder').t`Search in Trash` : placeholder}…`}
            prefix={<Icon name="magnifier" />}
            ref={inputRef}
            suffix={
                search !== '' && (
                    <Button
                        shape="ghost"
                        size="small"
                        color="weak"
                        icon
                        pill
                        onClick={handleClear}
                        title={c('Action').t`Clear search`}
                    >
                        <Icon name="cross" />
                    </Button>
                )
            }
            value={search}
        />
    );
};

export const SearchBar = memo(SearchBarRaw);
