import { type FC, useEffect, useState } from 'react';

import { c } from 'ttag';

import { PauseListTable } from '@proton/components/containers/pass/pauseList/PauseListTable';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { usePassBridge } from '@proton/pass/lib/bridge/PassBridgeProvider';
import type {
    PauseListEntryAddDTO,
    PauseListEntryDeleteDTO,
    PauseListEntryUpdateDTO,
} from '@proton/pass/lib/organization/types';
import type { OrganizationUrlPauseEntryDto } from '@proton/pass/types';

export const PauseList: FC = () => {
    const { organization } = usePassBridge();
    const { createNotification } = useNotifications();
    const handleError = useErrorHandler();
    const [loading, withLoading] = useLoading(true);

    const [entries, setEntries] = useState<OrganizationUrlPauseEntryDto[]>([]);

    const onEntryAdded = async (entry: PauseListEntryAddDTO) => {
        try {
            const result = await organization.pauseList.add(entry);
            const url = result.Url;
            createNotification({ text: c('Info').t`${url} added.` });
            setEntries((entries) => [...entries, result]);
        } catch (err) {
            handleError(err);
        }
    };

    const onEntryUpdated = async (updatedEntry: PauseListEntryUpdateDTO) => {
        try {
            await organization.pauseList.update(updatedEntry);
            createNotification({ text: c('Info').t`URL settings updated.` });
            setEntries((entries) =>
                entries.map((entry) =>
                    entry.EntryID === updatedEntry.id ? { ...entry, Values: updatedEntry.values } : entry
                )
            );
        } catch (err) {
            handleError(err);
        }
    };

    const onEntryDeleted = async ({ id, url }: PauseListEntryDeleteDTO) => {
        try {
            await organization.pauseList.delete(id);
            createNotification({ text: c('Info').t`${url} deleted.` });
            setEntries((entries) => entries.filter((entry) => entry.EntryID !== id));
        } catch (err) {
            handleError(err);
        }
    };

    const fetchEntries = () =>
        organization.pauseList.get().then((entries) => {
            setEntries(entries);
        });

    useEffect(() => {
        withLoading(fetchEntries()).catch(handleError);
    }, []);

    return (
        <PauseListTable
            entries={entries}
            onEntryAdded={onEntryAdded}
            onEntryDeleted={onEntryDeleted}
            onEntryUpdated={onEntryUpdated}
            loading={loading}
        />
    );
};
