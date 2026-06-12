import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableRow from '@proton/components/components/table/TableRow';
import useNotifications from '@proton/components/hooks/useNotifications';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { shortHumanSize } from '@proton/shared/lib/helpers/humanSize';

import { ConfirmationModal } from '../../components/ConfirmationModal/ConfirmationModal';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import {
    type OpfsRecording,
    deleteOpfsRecording,
    downloadOpfsRecording,
    listOpfsRecordings,
} from '../../hooks/useMeetingRecorderNew/recordingStorage/recordingFiles';

const formatDate = (timestamp: number) =>
    new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp));

export const ManageRecordingsContainer = () => {
    const { createNotification } = useNotifications();

    const [recordings, setRecordings] = useState<OpfsRecording[]>([]);
    const [loading, setLoading] = useState(true);
    const [recordingToDelete, setRecordingToDelete] = useState<OpfsRecording | null>(null);
    const [deleting, setDeleting] = useState(false);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            setRecordings(await listOpfsRecordings());
        } catch {
            createNotification({ type: 'error', text: c('Error').t`Failed to load recordings` });
        } finally {
            setLoading(false);
        }
    }, [createNotification]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const handleDownload = async (recording: OpfsRecording) => {
        try {
            await downloadOpfsRecording(recording);
        } catch {
            createNotification({ type: 'error', text: c('Error').t`Failed to download recording` });
        }
    };

    const handleConfirmDelete = async () => {
        if (!recordingToDelete) {
            return;
        }
        setDeleting(true);
        try {
            await deleteOpfsRecording(recordingToDelete.name);
            createNotification({ type: 'success', text: c('Info').t`Recording deleted` });
            setRecordingToDelete(null);
            await refresh();
        } catch {
            createNotification({ type: 'error', text: c('Error').t`Failed to delete recording` });
        } finally {
            setDeleting(false);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex justify-center py-7">
                    <CircleLoader size="medium" />
                </div>
            );
        }

        if (recordings.length === 0) {
            return (
                <div className="border rounded p-7 text-center color-weak">{c('Info')
                    .t`No recordings found on this device.`}</div>
            );
        }

        return (
            <Table responsive="cards" hasActions>
                <TableHeader
                    cells={[
                        c('Table header').t`Name`,
                        c('Table header').t`Date`,
                        c('Table header').t`Size`,
                        <span className="sr-only">{c('Table header').t`Actions`}</span>,
                    ]}
                />
                <TableBody>
                    {recordings.map((recording) => (
                        <TableRow
                            key={recording.name}
                            labels={[
                                c('Table header').t`Name`,
                                c('Table header').t`Date`,
                                c('Table header').t`Size`,
                                '',
                            ]}
                            cells={[
                                <span className="text-ellipsis" title={recording.name}>
                                    {recording.name}
                                </span>,
                                formatDate(recording.createdAt),
                                shortHumanSize(recording.size),
                                <div className="flex flex-nowrap gap-2 justify-end">
                                    <Button
                                        size="small"
                                        shape="ghost"
                                        icon
                                        onClick={() => handleDownload(recording)}
                                        title={c('Action').t`Download`}
                                    >
                                        <IcArrowDownLine alt={c('Action').t`Download`} />
                                    </Button>
                                    <Button
                                        size="small"
                                        shape="ghost"
                                        color="danger"
                                        icon
                                        onClick={() => setRecordingToDelete(recording)}
                                        title={c('Action').t`Delete`}
                                    >
                                        <IcTrash alt={c('Action').t`Delete`} />
                                    </Button>
                                </div>,
                            ]}
                        />
                    ))}
                </TableBody>
            </Table>
        );
    };

    return (
        <div className="overflow-y-auto h-full flex flex-column flex-nowrap">
            <div className="meet-container-padding-x w-full shrink-0">
                <PageHeader showAppSwitcher={!isElectronApp} />
            </div>
            <div className="p-7 max-w-custom mx-auto w-full" style={{ '--max-w-custom': '60rem' }}>
                <h1 className="text-bold text-2xl mb-1">{c('Title').t`Recordings`}</h1>
                <p className="color-weak mb-6">{c('Info')
                    .t`Recordings are stored locally in your browser. Download any you want to keep, they are automatically deleted after 30 days.`}</p>

                {renderContent()}

                {recordingToDelete && (
                    <ConfirmationModal
                        title={c('Title').t`Delete recording?`}
                        message={c('Info')
                            .t`This recording will be permanently deleted from this device. This action cannot be undone.`}
                        primaryText={c('Action').t`Delete`}
                        primaryButtonClass="danger"
                        primaryLoading={deleting}
                        onPrimaryAction={handleConfirmDelete}
                        secondaryText={c('Action').t`Cancel`}
                        onSecondaryAction={() => setRecordingToDelete(null)}
                        onClose={() => setRecordingToDelete(null)}
                    />
                )}
            </div>
        </div>
    );
};
