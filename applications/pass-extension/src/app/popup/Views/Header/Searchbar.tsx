import { type VFC, memo, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useItemsFilteringContext } from 'proton-pass-extension/lib/hooks/useItemsFilteringContext';
import { useNavigationContext } from 'proton-pass-extension/lib/hooks/useNavigationContext';
import { c } from 'ttag';

import { Button, Input } from '@proton/atoms';
import { Icon } from '@proton/components/components';
import { popupMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import { selectShare } from '@proton/pass/store/selectors';
import type { ShareType } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';

import { getItemTypeOptions } from '../Sidebar/ItemsFilter';

import './Searchbar.scss';

const SearchbarRaw: VFC<{ disabled?: boolean; value: string; handleValue: (value: string) => void }> = ({
    disabled,
    value,
    handleValue,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const { inTrash } = useNavigationContext();
    const { shareId } = useItemsFilteringContext();
    const { type } = useItemsFilteringContext();

    const vault = useSelector(selectShare<ShareType.Vault>(shareId));

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
        handleValue('');
        inputRef.current?.focus();
    };

    const handleFocus = () => {
        inputRef.current?.select();
    };

    const handleBlur = () => {
        void (
            !isEmptyString(value) &&
            sendMessage(
                popupMessage({
                    type: WorkerMessageType.TELEMETRY_EVENT,
                    payload: {
                        event: createTelemetryEvent(TelemetryEventName.SearchTriggered, {}, {}),
                    },
                })
            )
        );
    };

    useEffect(() => {
        handleFocus();
    }, []);

    return (
        <Input
            autoFocus
            className="pass-searchbar"
            disabled={disabled}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onValue={handleValue}
            placeholder={`${inTrash ? c('Placeholder').t`Search in Trash` : placeholder}…`}
            prefix={<Icon name="magnifier" />}
            ref={inputRef}
            suffix={
                value !== '' && (
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
            value={value}
        />
    );
};

export const Searchbar = memo(SearchbarRaw);
