import { type VFC, memo, useRef } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button, Input } from '@proton/atoms';
import { Icon } from '@proton/components/components';
import { popupMessage, sendMessage } from '@proton/pass/extension/message';
import { selectShare } from '@proton/pass/store';
import { createTelemetryEvent } from '@proton/pass/telemetry/events';
import type { ShareType } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { isEmptyString } from '@proton/pass/utils/string';

import { useItemsFilteringContext } from '../../hooks/useItemsFilteringContext';
import { useNavigationContext } from '../../hooks/useNavigationContext';

import './Searchbar.scss';

/**
 * FIXME: if we get reports of the search ever feeling slow or sluggish,
 * we might have to either debounce the search query value handling and/or
 * to implement the component as a an uncontroller input.
 */
const SearchbarRaw: VFC<{ disabled?: boolean; value: string; handleValue: (value: string) => void }> = ({
    disabled,
    value,
    handleValue,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const { inTrash } = useNavigationContext();
    const { shareId } = useItemsFilteringContext();

    const vault = useSelector(selectShare<ShareType.Vault>(shareId));
    const placeholder = vault
        ? c('Placeholder').t`Search in ${vault.content.name}`
        : c('Placeholder').t`Search in all vaults`;

    const handleClear = () => {
        handleValue('');
        inputRef.current?.focus();
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

    return (
        <Input
            ref={inputRef}
            className="pass-searchbar"
            placeholder={`${inTrash ? c('Placeholder').t`Search in Trash` : placeholder}…
`}
            prefix={<Icon name="magnifier" />}
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
            onValue={handleValue}
            onBlur={handleBlur}
            disabled={disabled}
            autoFocus
        />
    );
};

export const Searchbar = memo(SearchbarRaw);
