import type { ChangeEvent, FC } from 'react';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import Toggle from '@proton/components/components/toggle/Toggle';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { VaultMultiSelect } from '@proton/pass/components/Vault/VaultSelect';
import { useRequest } from '@proton/pass/hooks/useRequest';
import type { PersonalAccessToken } from '@proton/pass/lib/access-token/access-token.types';
import { createAccessToken } from '@proton/pass/store/actions';
import { selectWritableVaults } from '@proton/pass/store/selectors';
import { sortOn } from '@proton/pass/utils/fp/sort';
import { DAY_IN_MINUTES, HOUR_IN_MINUTES, MONTH_IN_MINUTES, WEEK_IN_MINUTES, YEAR_IN_MINUTES } from '@proton/pass/utils/time/constants';

type Props = {
    onClose: () => void;
    onCreated: (envVar: string, pat: PersonalAccessToken, agent: boolean) => void;
};

const MAX_NAME_LENGTH = 191;
const MIN_EXPIRATION_MINUTES = 60;
const MAX_EXPIRATION_MINUTES = 365 * 24 * 60;

type ExpirationPreset = keyof typeof EXPIRATION_PRESETS;
const EXPIRATION_PRESETS = {
    hour: {
        label: () => c('Label').t`1 hour`,
        value: HOUR_IN_MINUTES,
    },
    day: {
        label: () => c('Label').t`1 day`,
        value: DAY_IN_MINUTES,
    },
    week: {
        label: () => c('Label').t`1 week`,
        value: WEEK_IN_MINUTES,
    },
    month: {
        label: () => c('Label').t`1 month`,
        value: MONTH_IN_MINUTES,
    },
    year: {
        label: () => c('Label').t`1 year`,
        value: YEAR_IN_MINUTES,
    },
    custom: {
        label: () => c('Label').t`Custom`,
        value: 'custom',
    },
} as const;

const EXPIRATION_PRESET_OPTIONS = Object.keys(EXPIRATION_PRESETS) as ExpirationPreset[];

export const CreateTokenModal: FC<Props> = ({ onClose, onCreated }) => {
    const writableVaults = useSelector(selectWritableVaults);

    const vaults = useMemo(() => [...writableVaults].sort(sortOn('createTime', 'ASC')), [writableVaults]);

    const [name, setName] = useState('');
    const [expirationPreset, setExpirationPreset] = useState<ExpirationPreset>('hour');
    const [customExpirationMinutes, setCustomExpirationMinutes] = useState('60');
    const [isAgent, setIsAgent] = useState(false);
    const [selectedShareIds, setSelectedShareIds] = useState<Set<string>>(() => new Set());
    const [nameError, setNameError] = useState('');
    const [minutesError, setMinutesError] = useState('');

    const create = useRequest(createAccessToken, {
        onSuccess: ({ envVar, pat, isAgent: agent }) => onCreated(envVar, pat, agent),
    });

    const toggleVault = (shareId: string) => {
        setSelectedShareIds((prev) => {
            const next = new Set(prev);
            if (next.has(shareId)) next.delete(shareId);
            else next.add(shareId);
            return next;
        });
    };

    const handleCreate = () => {
        const trimmedName = name.trim();

        if (!trimmedName) {
            setNameError(c('Error').t`Name is required`);
            return;
        }
        if (trimmedName.length > MAX_NAME_LENGTH) {
            setNameError(c('Error').t`Name must be 191 characters or fewer`);
            return;
        }

        const minutes =
            expirationPreset === 'custom'
                ? Number(customExpirationMinutes)
                : EXPIRATION_PRESETS[expirationPreset].value;

        if (
            !Number.isFinite(minutes) ||
            !Number.isInteger(minutes) ||
            minutes < MIN_EXPIRATION_MINUTES ||
            minutes > MAX_EXPIRATION_MINUTES
        ) {
            setMinutesError(c('Error').t`Expiration must be between 1 hour and 1 year`);
            return;
        }

        setNameError('');
        setMinutesError('');

        create.dispatch({
            name: trimmedName,
            expirationMinutes: minutes,
            isAgent,
            shareIds: Array.from(selectedShareIds),
        });
    };

    return (
        <PassModal open onClose={onClose} onReset={onClose} size="large">
            <ModalTwoHeader title={c('Title').t`Create new access token`} />
            <ModalTwoContent className="pt-2">
                <InputFieldTwo
                    id="pat-name"
                    label={c('Label').t`Token name`}
                    placeholder={c('Placeholder').t`e.g. My automation script`}
                    value={name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        setName(e.target.value);
                        if (nameError) setNameError('');
                    }}
                    error={nameError}
                    assistContainerClassName={nameError ? undefined : 'hidden'}
                    maxLength={MAX_NAME_LENGTH}
                    rootClassName="mb-4"
                    autoFocus
                />

                <InputFieldTwo
                    as={SelectTwo<ExpirationPreset>}
                    id="pat-expiry-preset"
                    label={c('Label').t`Expires in`}
                    onValue={(value) => {
                        setExpirationPreset(value);
                        if (minutesError) setMinutesError('');
                    }}
                    value={expirationPreset}
                    rootClassName="mb-4"
                >
                    {EXPIRATION_PRESET_OPTIONS.map((preset) => (
                        <Option key={preset} title={EXPIRATION_PRESETS[preset].label()} value={preset} />
                    ))}
                </InputFieldTwo>

                {expirationPreset === 'custom' && (
                    <InputFieldTwo
                        id="pat-expiry-minutes"
                        type="number"
                        min={MIN_EXPIRATION_MINUTES}
                        max={MAX_EXPIRATION_MINUTES}
                        step={1}
                        label={c('Label').t`Custom expiration (minutes)`}
                        hint={c('Info').t`Between 60 (1 hour) and 525600 (1 year)`}
                        placeholder={c('Placeholder').t`e.g. 60`}
                        value={customExpirationMinutes}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setCustomExpirationMinutes(e.target.value);
                            if (minutesError) setMinutesError('');
                        }}
                        error={minutesError}
                        assistContainerClassName={minutesError ? undefined : 'hidden'}
                        rootClassName="mb-4"
                    />
                )}

                <div className="flex items-start justify-space-between gap-4 mb-4">
                    <div className="flex-1">
                        <label htmlFor="pat-agent" className="text-bold block">
                            {c('Label').t`Use for AI agent`}
                        </label>
                        <span className="text-sm color-weak block mt-1">
                            {c('Info')
                                .t`The agent will be required to provide a reason for every action it performs, and each action will be recorded in an audit log you can review. After token creation, you'll get instructions to copy-paste into your AI agent.`}
                        </span>
                    </div>
                    <Toggle
                        id="pat-agent"
                        checked={isAgent}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setIsAgent(e.target.checked)}
                    />
                </div>

                <hr className="my-5 border-weak" />

                <div>
                    <div className="flex items-baseline justify-space-between mb-1">
                        <h3 className="text-bold text-lg m-0">{c('Label').t`Vault access`}</h3>
                        {vaults.length > 0 && (
                            <span className="text-sm color-weak">
                                {selectedShareIds.size > 0
                                    ? c('Info').t`${selectedShareIds.size} selected`
                                    : c('Info').t`None selected`}
                            </span>
                        )}
                    </div>
                    <p className="text-sm color-weak mt-0 mb-2">
                        {c('Info')
                            .t`This token gets read-only access to the vaults you select. It can read items, but cannot edit them, share vaults, or invite others. You can change this later.`}
                    </p>
                    <VaultMultiSelect
                        vaults={vaults}
                        selectedShareIds={selectedShareIds}
                        onToggle={toggleVault}
                        maxHeight="20rem"
                    />
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose} disabled={create.loading}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button
                    color="norm"
                    onClick={handleCreate}
                    loading={create.loading}
                    disabled={create.loading || selectedShareIds.size === 0}
                >
                    {c('Action').t`Create token`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};
