import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';
import { MAX_CALENDARS_FREE } from '@proton/shared/lib/calendar/constants';
import { getCalendarsSettingsPath } from '@proton/shared/lib/calendar/settingsRoutes';
import { APPS, BRAND_NAME, CALENDAR_APP_NAME, MAIL_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { AppLink } from '../../../components';

const getText = (isDowngrade: boolean) => {
    if (isDowngrade) {
        return c('Info').ngettext(
            msgid`You can keep up to ${MAX_CALENDARS_FREE} calendar. Please remove shared calendar links and any ${BRAND_NAME} user with whom you shared your calendars before you cancel your subscription.`,
            `You can keep up to ${MAX_CALENDARS_FREE} calendars. Please remove shared calendar links and any ${BRAND_NAME} user with whom you shared your calendars before you cancel your subscription.`,
            MAX_CALENDARS_FREE
        );
    }
    return c('Info').ngettext(
        msgid`You can keep up to ${MAX_CALENDARS_FREE} calendar. Please remove shared calendar links and any ${BRAND_NAME} user with whom you shared your calendars before you cancel your ${MAIL_SHORT_APP_NAME} subscription.`,
        `You can keep up to ${MAX_CALENDARS_FREE} calendars. Please remove shared calendar links and any ${BRAND_NAME} user with whom you shared your calendars before you cancel your ${MAIL_SHORT_APP_NAME} subscription.`,
        MAX_CALENDARS_FREE
    );
};

interface Props extends ModalProps {
    onConfirm: () => void;
    isDowngrade?: boolean;
}

const CalendarDowngradeModal = ({ isDowngrade, onConfirm, onClose, ...rest }: Props) => {
    const linkButton = (
        <AppLink toApp={APPS.PROTONACCOUNT} to={getCalendarsSettingsPath({ fullPath: true })} onClick={onClose}>
            {c('Action').t`Open ${CALENDAR_APP_NAME} settings`}
        </AppLink>
    );

    const title = isDowngrade
        ? c('Title').t`Downgrade account`
        : c('Title').t`Cancel ${MAIL_SHORT_APP_NAME} subscription`;
    const text = getText(!!isDowngrade);

    return (
        <Prompt
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
        </Prompt>
    );
};

export default CalendarDowngradeModal;
