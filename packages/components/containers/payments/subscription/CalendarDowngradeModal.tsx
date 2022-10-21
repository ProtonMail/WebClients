import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { getCalendarsSettingsPath } from '@proton/shared/lib/calendar/settingsRoutes';
import { APPS } from '@proton/shared/lib/constants';

import { AlertModal, AppLink, ModalProps } from '../../../components';

interface Props extends ModalProps {
    onConfirm: () => void;
    isDowngrade?: boolean;
}

const CALENDAR_APP_NAME = getAppName(APPS.PROTONCALENDAR);

const CalendarDowngradeModal = ({ isDowngrade, onConfirm, onClose, ...rest }: Props) => {
    const linkButton = (
        <AppLink toApp={APPS.PROTONACCOUNT} to={getCalendarsSettingsPath({ fullPath: true })} onClick={onClose}>
            {c('Action').t`Open ${CALENDAR_APP_NAME} settings`}
        </AppLink>
    );

    const title = isDowngrade ? c('Title').t`Downgrade account` : c('Title').t`Cancel Mail subscription`;
    const text = isDowngrade
        ? c('Info')
              .t`You must remove any additional personal calendars and any shared calendar links before you can cancel your subscription.`
        : c('Info')
              .t`You must remove any additional personal calendars and any shared calendar links before you can cancel your Mail subscription.`;

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
