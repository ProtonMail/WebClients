import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button, Input } from '@proton/atoms';
import { Icon } from '@proton/components';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { getItemTypeOptions } from '@proton/pass/components/Item/Filters/Type';
import { useNavigationFilters } from '@proton/pass/components/Navigation/NavigationFilters';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { useDebouncedValue } from '@proton/pass/hooks/useDebouncedValue';
import { useSearchShortcut } from '@proton/pass/hooks/useSearchShortcut';
import { selectShare } from '@proton/pass/store/selectors';
import type { ShareType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';

import './SearchBar.scss';

type Props = {
    disabled?: boolean;
    trash?: boolean;
};

const SEARCH_DEBOUNCE_TIME = 75;

export const SearchBar = memo(({ disabled, trash }: Props) => {
    const { onTelemetry } = usePassCore();
    const scope = useItemScope();
    const { filters, setFilters } = useNavigationFilters();

    const [search, setSearch] = useState<string>(filters.search ?? '');
    const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_TIME);

    const inputRef = useRef<HTMLInputElement>(null);
    const { selectedShareId, type = '*' } = filters;

    const vault = useSelector(selectShare<ShareType.Vault>(selectedShareId));

    const placeholder = useMemo(() => {
        const ITEM_TYPE_TO_LABEL_MAP = getItemTypeOptions();
        const pluralItemType = ITEM_TYPE_TO_LABEL_MAP[type].label.toLowerCase();

        const vaultName = (() => {
            switch (scope) {
                case 'trash':
                    return c('Label').t`Trash`;
                case 'secure-links':
                    return c('Action').t`Secure links`;
                case 'shared-by-me':
                    return c('Label').t`Shared by me`;
                case 'shared-with-me':
                    return c('Label').t`Shared with me`;
                default:
                    return vault?.content.name.trim();
            }
        })();

        switch (type) {
            case '*':
                return vaultName ? c('Placeholder').t`Search in ${vaultName}` : c('Placeholder').t`Search in all items`;
            default: {
                // translator: ${pluralItemType} can be either "logins", "notes", "aliases", or "cards". Full sentence example: "Search notes in all vaults"
                return vaultName
                    ? c('Placeholder').t`Search ${pluralItemType} in ${vaultName}`
                    : c('Placeholder').t`Search ${pluralItemType} in all items`;
            }
        }
    }, [vault, type, scope]);

    const handleClear = () => {
        setSearch('');
        setFilters({ search: '' });
        inputRef.current?.focus();
    };

    const handleFocus = () => inputRef.current?.select();

    const handleBlur = () => {
        if (isEmptyString(search)) return;
        void onTelemetry(TelemetryEventName.SearchTriggered, {}, {});
    };

    useSearchShortcut(handleFocus);

    useEffect(handleFocus, []);
    useEffect(() => setFilters({ search: debouncedSearch }), [debouncedSearch]);

    useEffect(() => {
        /** Edge-case: reset internal search state
         * if `filters.search` was cleared */
        if (filters.search === '') setSearch('');
    }, [filters.search]);

    return (
        <Input
            autoFocus
            className="pass-searchbar"
            inputClassName="text-rg"
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
});

SearchBar.displayName = 'SearchBarMemo';
