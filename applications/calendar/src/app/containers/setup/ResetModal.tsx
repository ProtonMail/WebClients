import { useState } from 'react';
import { c } from 'ttag';
import {
    FormModal,
    useApi,
    useGetAddresses,
    useGetAddressKeys,
    GenericError,
    Loader,
    useLoading,
    useCache,
} from '@proton/components';
import noop from '@proton/utils/noop';
import { CALENDAR_FLAGS } from '@proton/shared/lib/calendar/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { process } from '@proton/shared/lib/calendar/keys/resetHelper';
import CalendarResetSection from './CalendarResetSection';
import CalendarReactivateSection from './CalendarReactivateSection';

enum STEPS {
    LOADING,
    RESET_CALENDARS,
    REACTIVATE_CALENDARS,
}

interface FilteredCalendars {
    calendarsToReset: VisualCalendar[];
    calendarsToReactivate: VisualCalendar[];
}

interface Props {
    calendars: VisualCalendar[];
    onClose?: () => void;
    onExit?: () => void;
}
const ResetModal = ({ onClose, calendars, ...rest }: Props) => {
    const api = useApi();
    const cache = useCache();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();

    const [{ calendarsToReset, calendarsToReactivate }] = useState(() => {
        return calendars.reduce<FilteredCalendars>(
            (acc, calendar) => {
                const { Flags } = calendar;
                if (hasBit(Flags, CALENDAR_FLAGS.RESET_NEEDED)) {
                    acc.calendarsToReset.push(calendar);
                } else if (hasBit(Flags, CALENDAR_FLAGS.UPDATE_PASSPHRASE)) {
                    acc.calendarsToReactivate.push(calendar);
                }
                return acc;
            },
            {
                calendarsToReset: [],
                calendarsToReactivate: [],
            }
        );
    });

    const [step, setStep] = useState(() => {
        if (calendarsToReset.length > 0) {
            return STEPS.RESET_CALENDARS;
        }
        if (calendarsToReactivate.length > 0) {
            return STEPS.REACTIVATE_CALENDARS;
        }
        throw new Error('Unexpected state');
    });

    const [isLoading, withLoading] = useLoading(false);
    const [error, setError] = useState(false);

    const handleProcess = () => {
        return withLoading(
            process({
                api,
                cache,
                getAddressKeys,
                getAddresses,
                calendarsToReset,
                calendarsToReactivate,
            })
        );
    };

    const { section, ...modalProps } = (() => {
        if (error) {
            return {
                title: c('Title').t`Error`,
                submit: c('Action').t`Close`,
                hasClose: false,
                section: <GenericError />,
                onSubmit() {
                    window.location.reload();
                },
            };
        }

        if (step === STEPS.LOADING) {
            return {
                section: <Loader />,
            };
        }

        if (step === STEPS.RESET_CALENDARS) {
            return {
                title: c('Title').t`Reset calendar keys`,
                section: <CalendarResetSection calendarsToReset={calendarsToReset} />,
                loading: isLoading,
                onSubmit: () => {
                    if (calendarsToReactivate.length > 0) {
                        return setStep(STEPS.REACTIVATE_CALENDARS);
                    }
                    handleProcess()
                        .then(() => {
                            onClose?.();
                        })
                        .catch((error) => {
                            console.error(error);
                            setError(true);
                        });
                },
            };
        }

        if (step === STEPS.REACTIVATE_CALENDARS) {
            return {
                title: c('Title').t`Reactivate calendar keys`,
                section: <CalendarReactivateSection calendarsToReactivate={calendarsToReactivate} />,
                loading: isLoading,
                onSubmit: () => {
                    handleProcess()
                        .then(() => {
                            onClose?.();
                        })
                        .catch(() => {
                            console.error(error);
                            setError(true);
                        });
                },
            };
        }

        throw new Error('Unknown step');
    })();

    return (
        <FormModal
            title=""
            close={null}
            onClose={noop}
            onSubmit={noop}
            submit={c('Action').t`Continue`}
            hasClose={false}
            {...modalProps}
            {...rest}
        >
            {section}
        </FormModal>
    );
};

export default ResetModal;
