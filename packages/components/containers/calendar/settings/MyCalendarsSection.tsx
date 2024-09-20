import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike, Card, Href } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import PrimaryButton from '@proton/components/components/button/PrimaryButton';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import { getNextDefaultCalendar } from '@proton/components/containers/calendar/settings/defaultCalendar';
import { removeCalendar, updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import { getProbablyActiveCalendars } from '@proton/shared/lib/calendar/calendar';
import { getCalendarsLimitReachedText } from '@proton/shared/lib/calendar/calendarLimits';
import { APP_UPSELL_REF_PATH, CALENDAR_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath, getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Address, Subscription, UserModel } from '@proton/shared/lib/interfaces';
import type { ModalWithProps } from '@proton/shared/lib/interfaces/Modal';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { useApi, useEventManager, useNotifications } from '../../../hooks';
import { useModalsMap } from '../../../hooks/useModalsMap';
import { PersonalCalendarModal } from '../calendarModal/personalCalendarModal/PersonalCalendarModal';
import { ExportModal } from '../exportModal/ExportModal';
import CalendarsSection from './CalendarsSection';

type ModalsMap = {
    calendarModal: ModalWithProps<{
        calendars?: VisualCalendar[];
        defaultCalendarID?: string;
        calendar?: VisualCalendar;
    }>;
    exportCalendarModal: ModalWithProps<{
        exportCalendar?: VisualCalendar;
    }>;
    deleteCalendarModal: ModalWithProps<{
        defaultCalendarWarning?: ReactNode;
        onClose: () => void;
        onConfirm: () => void;
    }>;
};

interface Props {
    addresses: Address[];
    user: UserModel;
    subscription?: Subscription;
    myCalendars: VisualCalendar[];
    defaultCalendar?: VisualCalendar;
    isCalendarsLimitReached: boolean;
    canAdd: boolean;
}

const MyCalendarsSection = ({
    addresses,
    user,
    subscription,
    myCalendars,
    defaultCalendar,
    isCalendarsLimitReached,
    canAdd,
}: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const { modalsMap, updateModal, closeModal } = useModalsMap<ModalsMap>({
        calendarModal: { isOpen: false },
        exportCalendarModal: { isOpen: false },
        deleteCalendarModal: { isOpen: false },
    });
    const [{ onExit: onExitCalendarModal, ...calendarModalProps }, setIsCalendarModalOpen] = useModalState();
    const [{ open: isExportModalOpen, onExit: onExitExportModal, ...exportModalProps }, setIsExportModalOpen] =
        useModalState();

    const defaultCalendarID = defaultCalendar?.ID;
    const isFreeUser = !user.hasPaidMail;
    const calendarsLimitReachedText = getCalendarsLimitReachedText(isFreeUser).combinedText;

    const handleCreateCalendar = () => {
        setIsCalendarModalOpen(true);
        updateModal('calendarModal', {
            isOpen: true,
            props: { calendars: myCalendars, defaultCalendarID },
        });
    };

    const handleEditCalendar = (calendar: VisualCalendar) => {
        setIsCalendarModalOpen(true);
        updateModal('calendarModal', {
            isOpen: true,
            props: { calendar },
        });
    };

    const handleSetDefaultCalendar = async (calendarID: string) => {
        await api(updateCalendarUserSettings({ DefaultCalendarID: calendarID }));
        await call();
        createNotification({ text: c('Success').t`Default calendar updated` });
    };

    const handleDeleteCalendar = async (id: string) => {
        const isDeleteDefaultCalendar = id === defaultCalendarID;
        const firstRemainingCalendar = getProbablyActiveCalendars(myCalendars).find(
            ({ ID: calendarID }) => calendarID !== id
        );

        // If deleting the default calendar, the new calendar to make default is either the first active calendar or null if there is none.
        const newDefaultCalendarID = isDeleteDefaultCalendar
            ? (firstRemainingCalendar && firstRemainingCalendar.ID) || null
            : undefined;

        await new Promise<void>((resolve, reject) => {
            const defaultCalendarWarning =
                isDeleteDefaultCalendar && firstRemainingCalendar
                    ? getNextDefaultCalendar(firstRemainingCalendar)
                    : null;

            updateModal('deleteCalendarModal', {
                isOpen: true,
                props: {
                    onClose: () => {
                        reject();
                        closeModal('deleteCalendarModal');
                    },
                    onConfirm: () => {
                        resolve();
                        closeModal('deleteCalendarModal');
                    },
                    defaultCalendarWarning,
                },
            });
        });
        await api(removeCalendar(id));
        // null is a valid default calendar id
        if (newDefaultCalendarID !== undefined) {
            await api(updateCalendarUserSettings({ DefaultCalendarID: newDefaultCalendarID }));
        }
        await call();
        createNotification({ text: c('Success').t`Calendar removed` });
    };

    const handleExportCalendar = (exportCalendar: VisualCalendar) => {
        setIsExportModalOpen(true);
        updateModal('exportCalendarModal', {
            isOpen: true,
            props: { exportCalendar },
        });
    };

    const { calendarModal, exportCalendarModal, deleteCalendarModal } = modalsMap;

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.CALENDAR_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.BANNER,
        feature: CALENDAR_UPSELL_PATHS.MULTI_CAL,
        isSettings: true,
    });

    const createCalendarButton = (
        <div className="mb-4">
            <PrimaryButton
                data-testid="calendar-setting-page:add-calendar"
                disabled={!canAdd}
                onClick={handleCreateCalendar}
            >
                {c('Action').t`Create calendar`}
            </PrimaryButton>
        </div>
    );
    const isCalendarsLimitReachedNode = isFreeUser ? (
        <Card rounded className="mb-4">
            <div className="flex flex-nowrap items-center">
                <p className="flex-1 my-0 pr-7">{calendarsLimitReachedText}</p>
                <ButtonLike
                    as={SettingsLink}
                    path={addUpsellPath(getUpgradePath({ user, subscription }), upsellRef)}
                    color="norm"
                    shape="solid"
                    size="small"
                >
                    {c('Action').t`Upgrade`}
                </ButtonLike>
            </div>
        </Card>
    ) : (
        <Alert className="mb-4" type="info">
            {calendarsLimitReachedText}
        </Alert>
    );

    return (
        <>
            <Prompt
                open={deleteCalendarModal.isOpen}
                title={c('Title').t`Delete calendar`}
                buttons={[
                    <Button color="danger" onClick={deleteCalendarModal.props?.onConfirm} type="submit">{c('Action')
                        .t`Delete`}</Button>,
                    <Button onClick={deleteCalendarModal.props?.onClose} type="submit">{c('Action').t`Cancel`}</Button>,
                ]}
                onClose={deleteCalendarModal.props?.onClose}
            >
                <div className="mb-4">{c('Info').t`Are you sure you want to delete this calendar?`}</div>
                {deleteCalendarModal.props?.defaultCalendarWarning}
            </Prompt>
            {!!exportCalendarModal.props?.exportCalendar && (
                <ExportModal
                    {...exportCalendarModal}
                    {...exportModalProps}
                    calendar={exportCalendarModal.props.exportCalendar}
                    isOpen={isExportModalOpen}
                    onExit={() => {
                        onExitCalendarModal?.();
                        updateModal('exportCalendarModal', {
                            isOpen: false,
                            props: undefined,
                        });
                    }}
                />
            )}

            {!!calendarModal.props && (
                <PersonalCalendarModal
                    {...calendarModal.props}
                    {...calendarModalProps}
                    onExit={() => {
                        onExitCalendarModal?.();
                        updateModal('calendarModal', {
                            isOpen: false,
                            props: undefined,
                        });
                    }}
                />
            )}

            <CalendarsSection
                calendars={myCalendars}
                addresses={addresses}
                user={user}
                defaultCalendarID={defaultCalendar?.ID}
                onSetDefault={handleSetDefaultCalendar}
                onEdit={handleEditCalendar}
                onDelete={handleDeleteCalendar}
                onExport={handleExportCalendar}
                data-testid="my-calendars-section"
            >
                <SettingsParagraph>
                    {c('Personal calendar section description')
                        .t`Create a calendar to stay on top of your schedule while keeping your data secure.`}
                    <br />
                    <Href href={getKnowledgeBaseUrl('/protoncalendar-calendars')}>{c('Knowledge base link label')
                        .t`Learn more`}</Href>
                </SettingsParagraph>
                {isCalendarsLimitReached ? isCalendarsLimitReachedNode : createCalendarButton}
            </CalendarsSection>
        </>
    );
};

export default MyCalendarsSection;
