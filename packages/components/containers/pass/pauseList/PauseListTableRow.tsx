import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import Checkbox from '@proton/components/components/input/Checkbox';
import TableCell from '@proton/components/components/table/TableCell';
import TableRow from '@proton/components/components/table/TableRow';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import type { PauseListEntryDeleteDTO } from '@proton/pass/lib/organization/types';
import type { OrganizationUrlPauseEntryDto, OrganizationUrlPauseEntryValues } from '@proton/pass/types';
import { intoCleanHostname } from '@proton/pass/utils/url/utils';
import isTruthy from '@proton/utils/isTruthy';

type NewEntry = Pick<OrganizationUrlPauseEntryDto, 'Url' | 'Values'>;

type NewRowProps = {
    entry: NewEntry;
    onUrlChange: (url: string) => void;
    onSubmit: (url: string) => void;
    onToggle: (field: keyof OrganizationUrlPauseEntryValues, entry: NewEntry) => void;
};

type ExistingRowProps = {
    entry: OrganizationUrlPauseEntryDto;
    onDelete: (entry: PauseListEntryDeleteDTO) => void;
    onToggle: (field: keyof OrganizationUrlPauseEntryValues, entry: OrganizationUrlPauseEntryDto) => void;
};

const FORM_ID = 'pause-list-form';

const urlValidator = (url: string) => (!intoCleanHostname(url) ? c('Error').t`Invalid URL` : '');

const renderCheckbox = <T extends { Values: OrganizationUrlPauseEntryValues }>(
    entry: T,
    field: keyof OrganizationUrlPauseEntryValues,
    label: string,
    onToggle: (field: keyof OrganizationUrlPauseEntryValues, entry: T) => void
) => {
    const displayChecked = !entry.Values[field];
    const styles = displayChecked
        ? {
              backgroundColor: 'var(--signal-danger)',
              borderColor: 'var(--signal-danger)',
          }
        : {};

    return (
        <TableCell label={label}>
            <Checkbox checked={displayChecked} onChange={() => onToggle(field, entry)} {...styles} />
        </TableCell>
    );
};

const renderCheckboxes = <T extends { Values: OrganizationUrlPauseEntryValues }>(
    entry: T,
    onToggle: (field: keyof OrganizationUrlPauseEntryValues, entry: T) => void
) => (
    <>
        {renderCheckbox(entry, 'AutofillEnabled', c('Label').t`Autofill`, onToggle)}
        {renderCheckbox(entry, 'Autofill2faEnabled', c('Label').t`Autofill 2FA`, onToggle)}
        {renderCheckbox(entry, 'AutofillAutosuggestEnabled', c('Label').t`Autosuggest`, onToggle)}
        {renderCheckbox(entry, 'AutosaveEnabled', c('Label').t`Autosave`, onToggle)}
        {renderCheckbox(entry, 'PasskeysEnabled', c('Label').t`Passkeys`, onToggle)}
    </>
);

export const PauseListTableRowNew: FC<NewRowProps> = ({ entry, onUrlChange, onSubmit, onToggle }) => {
    const { validator, onFormSubmit } = useFormErrors();

    return (
        <TableRow>
            <TableCell label={c('Label').t`Domains`}>
                <form
                    id={FORM_ID}
                    onSubmit={(e) => {
                        e.preventDefault();
                        const url = intoCleanHostname(entry.Url);
                        if (url && onFormSubmit()) {
                            onSubmit(url);
                        }
                    }}
                >
                    <InputFieldTwo
                        value={entry.Url}
                        onValue={onUrlChange}
                        dense
                        placeholder="example.com"
                        error={validator([entry.Url && urlValidator(entry.Url)].filter(isTruthy))}
                    />
                </form>
            </TableCell>
            {renderCheckboxes(entry, onToggle)}
            <TableCell>
                <Button color="norm" shape="solid" form={FORM_ID} type="submit">
                    {c('Action').t`Add`}
                </Button>
            </TableCell>
        </TableRow>
    );
};

export const PauseListTableRowExisting: FC<ExistingRowProps> = ({ entry, onDelete, onToggle }) => (
    <TableRow>
        <TableCell label={c('Label').t`Domain`}>
            <div className="text-ellipsis" title={entry.Url}>
                {entry.Url}
            </div>
        </TableCell>
        {renderCheckboxes(entry, onToggle)}
        <TableCell className="pass-pause-list--remove">
            <Button
                onClick={() => onDelete({ id: entry.EntryID, url: entry.Url })}
                title={c('Action').t`Remove`}
                color="danger"
                size="medium"
                shape="ghost"
                icon
            >
                <Icon name="cross-big" size={3} />
            </Button>
        </TableCell>
    </TableRow>
);
