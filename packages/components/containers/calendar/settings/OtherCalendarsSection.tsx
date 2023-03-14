import { ComponentPropsWithoutRef, useRef } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike, Card, Href } from '@proton/atoms';
import { FeatureCode, SharedCalendarsSection } from '@proton/components/containers';
import { removeCalendar } from '@proton/shared/lib/api/calendars';
import { getCalendarsLimitReachedText } from '@proton/shared/lib/calendar/calendarLimits';
import { APP_UPSELL_REF_PATH, CALENDAR_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { addUpsellPath } from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Address, UserModel } from '@proton/shared/lib/interfaces';
import { ModalWithProps } from '@proton/shared/lib/interfaces/Modal';
import { CalendarMemberInvitation, SubscribedCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { Alert, PrimaryButton, Prompt, SettingsLink, Tooltip, useModalState } from '../../../components';
import { useApi, useEventManager, useFeature, useNotifications } from '../../../hooks';
import { useModalsMap } from '../../../hooks/useModalsMap';
import { SettingsParagraph } from '../../account';
import { CalendarModal } from '../calendarModal/CalendarModal';
import SubscribedCalendarModal from '../subscribedCalendarModal/SubscribedCalendarModal';
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
    unknownCalendars: VisualCalendar[];
    addresses: Address[];
    user: UserModel;
    canAdd: boolean;
    isCalendarsLimitReached: boolean;
    unavailable?: boolean;
}

const OtherCalendarsSection = ({
    subscribedCalendars,
    sharedCalendars,
    calendarInvitations,
    unknownCalendars,
    addresses,
    user,
    canAdd,
    isCalendarsLimitReached,
    unavailable,
    ...rest
}: OtherCalendarsSectionProps) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const calendarSharingEnabled = !!useFeature(FeatureCode.CalendarSharingEnabled).feature?.Value;

    const [{ onExit: onExitCalendarModal, ...calendarModalProps }, setIsCalendarModalOpen] = useModalState();
    const [subscribedCalendarModal, setIsSubscribedCalendarModalOpen, renderSubscribedCalendarModal] = useModalState();

    const confirm = useRef<{ resolve: (param?: any) => any; reject: () => any }>();

    const { modalsMap, updateModal, closeModal } = useModalsMap<ModalsMap>({
        calendarModal: { isOpen: false },
        deleteCalendarModal: { isOpen: false },
    });

    const handleCreate = () => {
        setIsSubscribedCalendarModalOpen(true);
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
    const descriptionText = calendarSharingEnabled
        ? c('Subscribed calendar section description').t`Add public, external, or shared calendars.`
        : c('Subscribed calendar section description').t`Add public, external, or shared calendars using a URL.`;
    const addCalendarText = c('Action').t`Add calendar`;

    const addCalendarButton = (
        <div className="mb1">
            {unavailable ? (
                <Tooltip title={c('Tooltip').t`This feature is unavailable for the moment`}>
                    {/* a <span> is added artificially so that the disabled prop of the button does not hide the tooltip */}
                    <span>
                        <PrimaryButton data-test-id="calendar-setting-page:add-calendar" disabled>
                            {addCalendarText}
                        </PrimaryButton>
                    </span>
                </Tooltip>
            ) : (
                <PrimaryButton
                    data-test-id="calendar-setting-page:add-calendar"
                    disabled={!canAdd}
                    onClick={handleCreate}
                >
                    {addCalendarText}
                </PrimaryButton>
            )}
        </div>
    );
    const isCalendarsLimitReachedNode = isFreeUser ? (
        <Card rounded className="mb1">
            <div className="flex flex-nowrap flex-align-items-center">
                <p className="flex-item-fluid mt0 mb0 pr2">{calendarsLimitReachedText}</p>
                <ButtonLike
                    as={SettingsLink}
                    path={addUpsellPath(
                        '/upgrade',
                        `${APP_UPSELL_REF_PATH.CALENDAR_UPSELL_REF_PATH}${CALENDAR_UPSELL_PATHS.MULTI_CAL}`
                    )}
                    color="norm"
                    shape="solid"
                    size="small"
                >
                    {c('Action').t`Upgrade`}
                </ButtonLike>
            </div>
        </Card>
    ) : (
        <Alert className="mb1" type="info">
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
            {calendarModal.props?.editCalendar && (
                <CalendarModal
                    {...calendarModalProps}
                    calendar={calendarModal.props.editCalendar}
                    onExit={() => {
                        onExitCalendarModal?.();
                        updateModal('calendarModal', { isOpen: true, props: undefined });
                    }}
                />
            )}
            <CalendarsSection
                calendars={[...subscribedCalendars, ...unknownCalendars]}
                addresses={addresses}
                user={user}
                onEdit={handleEdit}
                onDelete={handleDelete}
                {...rest}
            >
                <SettingsParagraph>
                    {descriptionText}
                    <br />
                    <Href href={getKnowledgeBaseUrl('/subscribe-to-external-calendar')}>
                        {c('Knowledge base link label').t`Here's how`}
                    </Href>
                </SettingsParagraph>
                {isCalendarsLimitReached ? isCalendarsLimitReachedNode : addCalendarButton}
            </CalendarsSection>
            <SharedCalendarsSection
                user={user}
                addresses={addresses}
                calendars={sharedCalendars}
                calendarInvitations={calendarInvitations}
                canAddCalendars={canAdd && !isCalendarsLimitReached}
            />
        </>
    );
};

export default OtherCalendarsSection;
