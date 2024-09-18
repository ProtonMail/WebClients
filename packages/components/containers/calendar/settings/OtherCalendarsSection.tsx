import type { ComponentPropsWithoutRef } from 'react';
import { useRef } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike, Card, Href } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import PrimaryButton from '@proton/components/components/button/PrimaryButton';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import Prompt from '@proton/components/components/prompt/Prompt';
import { SharedCalendarsSection } from '@proton/components/containers';
import { removeCalendar } from '@proton/shared/lib/api/calendars';
import { getCalendarsLimitReachedText } from '@proton/shared/lib/calendar/calendarLimits';
import { APP_UPSELL_REF_PATH, CALENDAR_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath, getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Address, Subscription, UserModel } from '@proton/shared/lib/interfaces';
import type { ModalWithProps } from '@proton/shared/lib/interfaces/Modal';
import type {
    CalendarMemberInvitation,
    HolidaysDirectoryCalendar,
    SubscribedCalendar,
    VisualCalendar,
} from '@proton/shared/lib/interfaces/calendar';

import { useModalState } from '../../../components';
import { useApi, useEventManager, useNotifications } from '../../../hooks';
import { useModalsMap } from '../../../hooks/useModalsMap';
import { SettingsParagraph } from '../../account';
import HolidaysCalendarModal from '../calendarModal/holidaysCalendarModal/HolidaysCalendarModal';
import { PersonalCalendarModal } from '../calendarModal/personalCalendarModal/PersonalCalendarModal';
import SubscribedCalendarModal from '../calendarModal/subscribedCalendarModal/SubscribedCalendarModal';
import CalendarsSection from './CalendarsSection';

type ModalsMap = {
    calendarModal: ModalWithProps<{
        editCalendar?: VisualCalendar;
    }>;
    deleteCalendarModal: ModalWithProps;
};

export interface OtherCalendarsSectionProps extends ComponentPropsWithoutRef<'div'> {
    subscribedCalendars: SubscribedCalendar[];
    sharedCalendars: VisualCalendar[];
    calendarInvitations: CalendarMemberInvitation[];
    holidaysCalendars: VisualCalendar[];
    holidaysDirectory?: HolidaysDirectoryCalendar[];
    unknownCalendars: VisualCalendar[];
    addresses: Address[];
    subscription?: Subscription;
    user: UserModel;
    canAdd: boolean;
    isCalendarsLimitReached: boolean;
}

const OtherCalendarsSection = ({
    subscribedCalendars,
    sharedCalendars,
    calendarInvitations,
    holidaysCalendars,
    holidaysDirectory,
    unknownCalendars,
    addresses,
    user,
    subscription,
    canAdd,
    isCalendarsLimitReached,
    ...rest
}: OtherCalendarsSectionProps) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const [{ onExit: onExitCalendarModal, ...calendarModalProps }, setIsCalendarModalOpen] = useModalState();
    const [subscribedCalendarModal, setIsSubscribedCalendarModalOpen, renderSubscribedCalendarModal] = useModalState();
    const [holidaysCalendarModal, setHolidaysCalendarModalOpen, renderHolidaysCalendarModal] = useModalState();

    const confirm = useRef<{ resolve: (param?: any) => any; reject: () => any }>();

    const { modalsMap, updateModal, closeModal } = useModalsMap<ModalsMap>({
        calendarModal: { isOpen: false },
        deleteCalendarModal: { isOpen: false },
    });

    const handleCreate = () => {
        setIsSubscribedCalendarModalOpen(true);
    };

    const handleCreateHolidaysCalendar = () => {
        setHolidaysCalendarModalOpen(true);
    };

    const handleEdit = (editCalendar: VisualCalendar) => {
        setIsCalendarModalOpen(true);
        updateModal('calendarModal', { isOpen: true, props: { editCalendar } });
    };

    const handleDelete = async (id: string) => {
        await new Promise<void>((resolve, reject) => {
            updateModal('deleteCalendarModal', { isOpen: true });
            confirm.current = { resolve, reject };
        });

        await api(removeCalendar(id));
        await call();
        createNotification({ text: c('Success').t`Calendar removed` });
    };

    const { deleteCalendarModal, calendarModal } = modalsMap;

    const isFreeUser = !user.hasPaidMail;
    const calendarsLimitReachedText = getCalendarsLimitReachedText(isFreeUser).combinedText;
    const descriptionText = c('Subscribed calendar section description').t`Add public, external, or shared calendars.`;
    const addCalendarText = c('Action').t`Add calendar from URL`;
    const addHolidaysCalendarText = c('Action').t`Add public holidays`;

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.CALENDAR_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.BANNER,
        feature: CALENDAR_UPSELL_PATHS.MULTI_CAL,
        isSettings: true,
    });

    const addCalendarButtons = (
        <div className="mb-4">
            <>
                <PrimaryButton
                    data-testid="calendar-setting-page:add-holidays-calendar"
                    disabled={!canAdd}
                    onClick={handleCreateHolidaysCalendar}
                    className="mr-4"
                >
                    {addHolidaysCalendarText}
                </PrimaryButton>
                <PrimaryButton
                    data-test-id="calendar-setting-page:add-calendar"
                    disabled={!canAdd}
                    onClick={handleCreate}
                >
                    {addCalendarText}
                </PrimaryButton>
            </>
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
                title={c('Title').t`Remove calendar`}
                buttons={[
                    <Button
                        color="danger"
                        onClick={() => {
                            confirm.current?.resolve();
                            closeModal('deleteCalendarModal');
                        }}
                    >{c('Action').t`Remove calendar`}</Button>,
                    <Button
                        onClick={() => {
                            confirm.current?.reject();
                            closeModal('deleteCalendarModal');
                        }}
                    >{c('Action').t`Cancel`}</Button>,
                ]}
                onClose={() => confirm.current?.reject()}
            >
                {c('Info').t`The calendar will be removed from your account.`}
            </Prompt>

            {renderSubscribedCalendarModal && <SubscribedCalendarModal {...subscribedCalendarModal} />}
            {renderHolidaysCalendarModal && (
                <HolidaysCalendarModal {...holidaysCalendarModal} holidaysCalendars={holidaysCalendars} />
            )}
            {calendarModal.props?.editCalendar && (
                <PersonalCalendarModal
                    {...calendarModalProps}
                    calendar={calendarModal.props.editCalendar}
                    onExit={() => {
                        onExitCalendarModal?.();
                        updateModal('calendarModal', { isOpen: true, props: undefined });
                    }}
                />
            )}
            <CalendarsSection
                calendars={subscribedCalendars}
                addresses={addresses}
                user={user}
                nameHeader={c('Header; Table with list of calendars arranged by type').t`Subscribed`}
                onEdit={handleEdit}
                onDelete={handleDelete}
                data-testid="subscribed-calendars-section"
                {...rest}
            >
                <SettingsParagraph>
                    {descriptionText}
                    <br />
                    <Href href={getKnowledgeBaseUrl('/subscribe-to-external-calendar')}>
                        {c('Knowledge base link label').t`Here's how`}
                    </Href>
                </SettingsParagraph>
                {isCalendarsLimitReached ? isCalendarsLimitReachedNode : addCalendarButtons}
            </CalendarsSection>
            <CalendarsSection
                nameHeader={c('Header; Table with list of calendars arranged by type').t`Holidays`}
                calendars={holidaysCalendars}
                addresses={addresses}
                user={user}
                data-testid="holidays-calendars-section"
            />
            <SharedCalendarsSection
                user={user}
                addresses={addresses}
                calendars={sharedCalendars}
                calendarInvitations={calendarInvitations}
                canAddCalendars={canAdd && !isCalendarsLimitReached}
            />
            <CalendarsSection
                calendars={unknownCalendars}
                addresses={addresses}
                user={user}
                nameHeader={c('Header; Table with list of calendars arranged by type').t`Other`}
                onEdit={handleEdit}
                onDelete={handleDelete}
                data-testid="unknown-calendars-section"
            />
        </>
    );
};

export default OtherCalendarsSection;
