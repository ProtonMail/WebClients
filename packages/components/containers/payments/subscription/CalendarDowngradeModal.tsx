import { c } from 'ttag';
import { APPS } from '@proton/shared/lib/constants';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { AlertModal, AppLink, Button, ModalProps } from '../../../components';

interface Props extends ModalProps {
    onConfirm: () => void;
}

const CALENDAR_APP_NAME = getAppName(APPS.PROTONCALENDAR);

const CalendarDowngradeModal = ({ onConfirm, onClose, ...rest }: Props) => {
    const linkButton = (
        <AppLink toApp={APPS.PROTONACCOUNT} to="/calendar/calendars" onClick={onClose}>
            {c('Action').t`Open ${CALENDAR_APP_NAME} settings`}
        </AppLink>
    );

    return (
        <AlertModal
            title={c('Title').t`Downgrade account`}
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
                {c('Info')
                    .t`You must remove any additional personal calendars and any shared calendar links before you can cancel your subscription.`}
                <br />
                {linkButton}
            </div>
        </AlertModal>
    );
};

export default CalendarDowngradeModal;
