import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { MAX_CALENDARS_FREE } from '@proton/shared/lib/calendar/constants';
import { getCalendarsSettingsPath } from '@proton/shared/lib/calendar/settingsRoutes';
import { APPS, BRAND_NAME, CALENDAR_APP_NAME, MAIL_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { AlertModal, AppLink, ModalProps } from '../../../components';
import { useFeature } from '../../../hooks';
import { FeatureCode } from '../../index';

const getText = (isDowngrade: boolean, calendarSharingEnabled: boolean) => {
    if (isDowngrade) {
        if (calendarSharingEnabled) {
            return c('Info').ngettext(
                msgid`You can keep up to ${MAX_CALENDARS_FREE} calendar. Please remove shared calendar links and any ${BRAND_NAME} user with whom you shared your calendars before you cancel your subscription.`,
                `You can keep up to ${MAX_CALENDARS_FREE} calendars. Please remove shared calendar links and any ${BRAND_NAME} user with whom you shared your calendars before you cancel your subscription.`,
                MAX_CALENDARS_FREE
            );
        }
        return c('Info').ngettext(
            msgid`You can keep up to ${MAX_CALENDARS_FREE} calendar. Please remove shared calendar links before you cancel your subscription.`,
            `You can keep up to ${MAX_CALENDARS_FREE} calendars. Please remove shared calendar links before you cancel your subscription.`,
            MAX_CALENDARS_FREE
        );
    }
    if (calendarSharingEnabled) {
        return c('Info').ngettext(
            msgid`You can keep up to ${MAX_CALENDARS_FREE} calendar. Please remove shared calendar links and any ${BRAND_NAME} user with whom you shared your calendars before you cancel your ${MAIL_SHORT_APP_NAME} subscription.`,
            `You can keep up to ${MAX_CALENDARS_FREE} calendars. Please remove shared calendar links and any ${BRAND_NAME} user with whom you shared your calendars before you cancel your ${MAIL_SHORT_APP_NAME} subscription.`,
            MAX_CALENDARS_FREE
        );
    }
    return c('Info').ngettext(
        msgid`You can keep up to ${MAX_CALENDARS_FREE} calendar. Please remove shared calendar links before you cancel your ${MAIL_SHORT_APP_NAME} subscription.`,
        `You can keep up to ${MAX_CALENDARS_FREE} calendars. Please remove shared calendar links before you cancel your ${MAIL_SHORT_APP_NAME} subscription.`,
        MAX_CALENDARS_FREE
    );
};

interface Props extends ModalProps {
    onConfirm: () => void;
    isDowngrade?: boolean;
}

const CalendarDowngradeModal = ({ isDowngrade, onConfirm, onClose, ...rest }: Props) => {
    const calendarSharingEnabled = !!useFeature(FeatureCode.CalendarSharingEnabled).feature?.Value;

    const linkButton = (
        <AppLink toApp={APPS.PROTONACCOUNT} to={getCalendarsSettingsPath({ fullPath: true })} onClick={onClose}>
            {c('Action').t`Open ${CALENDAR_APP_NAME} settings`}
        </AppLink>
    );

    const title = isDowngrade
        ? c('Title').t`Downgrade account`
        : c('Title').t`Cancel ${MAIL_SHORT_APP_NAME} subscription`;
    const text = getText(!!isDowngrade, calendarSharingEnabled);

    return (
        <AlertModal
            title={title}
            buttons={[
                <Button
                    onClick={() => {
                        onConfirm();
                        onClose?.();
                    }}
                    color="norm"
                >
                    {c('Action').t`OK`}
                </Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            onClose={onClose}
            {...rest}
        >
            <div>
                {text}
                <br />
                {linkButton}
            </div>
        </AlertModal>
    );
};

export default CalendarDowngradeModal;
