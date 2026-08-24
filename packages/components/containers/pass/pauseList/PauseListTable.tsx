import { type FC, useState } from 'react';

import { c } from 'ttag';

import { TableRowLoading } from '@proton/pass/components/Layout/Table/TableRowLoading';
import type {
    PauseListEntryAddDTO,
    PauseListEntryDeleteDTO,
    PauseListEntryUpdateDTO,
} from '@proton/pass/lib/organization/types';
import type { OrganizationUrlPauseEntryDto, OrganizationUrlPauseEntryValues } from '@proton/pass/types';

import Table from '../../../components/table/Table';
import TableBody from '../../../components/table/TableBody';
import TableHeader from '../../../components/table/TableHeader';
import TableHeaderCell from '../../../components/table/TableHeaderCell';
import TableRow from '../../../components/table/TableRow';
import { PauseListTableRowExisting, PauseListTableRowNew } from './PauseListTableRow';

import './PauseListTable.scss';

type Props = {
    entries: OrganizationUrlPauseEntryDto[];
    onEntryAdded: (entry: PauseListEntryAddDTO) => void;
    onEntryUpdated: (entry: PauseListEntryUpdateDTO) => void;
    onEntryDeleted: (entry: PauseListEntryDeleteDTO) => void;
    loading?: boolean;
};

export const PauseListTable: FC<Props> = ({ entries, onEntryAdded, onEntryDeleted, onEntryUpdated, loading }) => {
    const [newEntryUrl, setNewEntryUrl] = useState('');
    const [newEntryValues, setNewEntryValues] = useState<OrganizationUrlPauseEntryValues>({
        Autofill2faEnabled: false,
        AutofillAutosuggestEnabled: false,
        AutofillEnabled: false,
        AutosaveEnabled: false,
        PasskeysEnabled: false,
    });

    const handleAddEntry = (url: string) => {
        onEntryAdded({ url, values: newEntryValues });
        setNewEntryUrl('');
    };

    const toggleNewEntryCriteria = (criteria: keyof OrganizationUrlPauseEntryValues) => {
        setNewEntryValues((entry) => ({ ...entry, [criteria]: !entry[criteria] }));
    };

    const toggleEntryCriteria = (
        criteria: keyof OrganizationUrlPauseEntryValues,
        entry: OrganizationUrlPauseEntryDto
    ) => {
        onEntryUpdated({ id: entry.EntryID, values: { ...entry.Values, [criteria]: !entry.Values[criteria] } });
    };

    return (
        <Table className="pass-pause-list--table" responsive="cards" hasActions borderWeak>
            <TableHeader>
                <TableRow>
                    <TableHeaderCell className="w-1/3">
                        <small className="text-xs">{c('Label').t`Domain`}</small>
                    </TableHeaderCell>
                    <TableHeaderCell>
                        <small className="text-xs">{c('Label').t`Autofill`}</small>
                    </TableHeaderCell>
                    <TableHeaderCell>
                        <small className="text-xs">{c('Label').t`Autofill 2FA`}</small>
                    </TableHeaderCell>
                    <TableHeaderCell>
                        <small className="text-xs">{c('Label').t`Autosuggest`}</small>
                    </TableHeaderCell>
                    <TableHeaderCell>
                        <small className="text-xs">{c('Label').t`Autosave`}</small>
                    </TableHeaderCell>
                    <TableHeaderCell>
                        <small className="text-xs">{c('Label').t`Passkeys`}</small>
                    </TableHeaderCell>
                    <TableHeaderCell>
                        <small className="text-xs">{c('Label').t`Action`}</small>
                    </TableHeaderCell>
                </TableRow>
            </TableHeader>

            <TableBody>
                {loading ? (
                    <TableRowLoading rows={1} cells={7} />
                ) : (
                    <>
                        <PauseListTableRowNew
                            entry={{ Url: newEntryUrl, Values: newEntryValues }}
                            onToggle={toggleNewEntryCriteria}
                            onUrlChange={setNewEntryUrl}
                            onSubmit={handleAddEntry}
                        />

                        {entries.map((entry) => (
                            <PauseListTableRowExisting
                                key={`pause-row-${entry.EntryID}`}
                                entry={entry}
                                onToggle={toggleEntryCriteria}
                                onDelete={onEntryDeleted}
                            />
                        ))}
                    </>
                )}
            </TableBody>
        </Table>
    );
};
