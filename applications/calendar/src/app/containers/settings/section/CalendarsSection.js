import React from 'react';
import {
    useApi,
    useEventManager,
    useNotifications,
    useLoading,
    SubTitle,
    PrimaryButton,
    ErrorButton,
    useModals,
    Tooltip,
    ConfirmModal,
    Alert
} from 'react-components';
import { c } from 'ttag';

import CalendarsTable from './CalendarsTable';
import CalendarModal from '../CalendarModal';
import { removeCalendar } from 'proton-shared/lib/api/calendars';

const CalendarsSection = ({ calendars }) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const [loading, withLoading] = useLoading();

    const handleCreate = () => {
        createModal(<CalendarModal />);
    };

    const handleEdit = (calendar) => {
        createModal(<CalendarModal calendar={calendar} />);
    };

    const handleDelete = async ({ ID }) => {
        await new Promise((resolve, reject) => {
            createModal(
                <ConfirmModal
                    title={c('Title').t`Delete calendar`}
                    confirm={<ErrorButton type="submit">{c('Action').t`Delete`}</ErrorButton>}
                    onClose={reject}
                    onConfirm={resolve}
                >
                    <Alert type="error">{c('Info').t`Are you sure you want to delete this calendar?`}</Alert>
                </ConfirmModal>
            );
        });
        await api(removeCalendar(ID));
        await call();
        createNotification({ text: c('Success').t`Calendar removed` });
    };

    const canAddCalendar = calendars.length === 0;

    return (
        <>
            <SubTitle>{c('Title').t`Calendars`}</SubTitle>
            <div className="mb1">
                {canAddCalendar ? (
                    <PrimaryButton onClick={handleCreate}>{c('Action').t`Add calendar`}</PrimaryButton>
                ) : (
                    <Tooltip title={c('Info').t`Feature coming soon`}>
                        <PrimaryButton disabled={true}>{c('Action').t`Add calendar`}</PrimaryButton>
                    </Tooltip>
                )}
            </div>
            <CalendarsTable
                calendars={calendars}
                onDelete={(calendar) => withLoading(handleDelete(calendar))}
                onEdit={handleEdit}
                loading={loading}
            />
        </>
    );
};

export default CalendarsSection;
