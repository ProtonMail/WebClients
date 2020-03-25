import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import {
    FormModal,
    useEventManager,
    useApi,
    useGetAddresses,
    useGetAddressKeys,
    GenericError,
    Loader,
    useLoading,
    useCache
} from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';
import { CALENDAR_FLAGS } from 'proton-shared/lib/calendar/constants';
import { process } from './reset/resetHelper';
import CalendarCreating from './CalendarCreating';
import CalendarReady from './CalendarReady';
import CalendarResetSection from './CalendarResetSection';
import { hasBit } from 'proton-shared/lib/helpers/bitset';
import CalendarReactivateSection from './CalendarReactivateSection';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';

enum STEPS {
    LOADING,
    RESET_CALENDARS,
    SETUP_CALENDARS,
    REACTIVATE_CALENDARS
}

interface FilteredCalendars {
    calendarsToSetup: Calendar[];
    calendarsToReset: Calendar[];
    calendarsToReactivate: Calendar[];
}

interface Props {
    calendars: Calendar[];
    onClose?: () => void;
    onExit?: () => void;
}
const ResetModal = ({ onClose, calendars, ...rest }: Props) => {
    const api = useApi();
    const cache = useCache();
    const { call } = useEventManager();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();

    const [{ calendarsToSetup, calendarsToReset, calendarsToReactivate }] = useState(() => {
        return calendars.reduce(
            (acc, calendar) => {
                const { Flags } = calendar;
                if (hasBit(Flags, CALENDAR_FLAGS.INCOMPLETE_SETUP)) {
                    acc.calendarsToSetup.push(calendar);
                } else if (hasBit(Flags, CALENDAR_FLAGS.RESET_NEEDED)) {
                    acc.calendarsToReset.push(calendar);
                } else if (hasBit(Flags, CALENDAR_FLAGS.UPDATE_PASSPHRASE)) {
                    acc.calendarsToReactivate.push(calendar);
                }
                return acc;
            },
            {
                calendarsToSetup: [],
                calendarsToReset: [],
                calendarsToReactivate: []
            } as FilteredCalendars
        );
    });

    const [step, setStep] = useState(() => {
        if (calendarsToReset.length > 0) {
            return STEPS.RESET_CALENDARS;
        }
        if (calendarsToReactivate.length > 0) {
            return STEPS.REACTIVATE_CALENDARS;
        }
        if (calendarsToSetup.length > 0) {
            return STEPS.SETUP_CALENDARS;
        }
        throw new Error('Unexpected state');
    });

    const [isLoading, withLoading] = useLoading(step === STEPS.SETUP_CALENDARS);
    const [error, setError] = useState(false);

    const handleProcess = () => {
        return withLoading(
            process({
                api,
                cache,
                call,
                getAddressKeys,
                getAddresses,
                calendarsToReset,
                calendarsToSetup,
                calendarsToReactivate
            })
        );
    };

    useEffect(() => {
        if (step === STEPS.SETUP_CALENDARS) {
            handleProcess().catch((e) => {
                console.log(e);
                setError(true);
            });
        }
    }, []);

    const { section, ...modalProps } = (() => {
        if (error) {
            return {
                title: c('Title').t`Error`,
                submit: c('Action').t`Close`,
                hasClose: false,
                section: <GenericError />,
                onSubmit() {
                    window.location.reload();
                }
            };
        }

        if (step === STEPS.LOADING) {
            return {
                section: <Loader />
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
                        .catch((e) => {
                            console.log(e);
                            setError(true);
                        });
                }
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
                        .catch((e) => {
                            console.log(e);
                            setError(true);
                        });
                }
            };
        }

        if (step === STEPS.SETUP_CALENDARS) {
            return {
                loading: isLoading,
                title: isLoading ? c('Title').t`Preparing your calendar` : c('Title').t`Welcome to ProtonCalendar`,
                section: isLoading ? <CalendarCreating /> : <CalendarReady />,
                onSubmit: isLoading ? noop : onClose
            };
        }

        throw new Error('Unknown step');
    })();

    return (
        <FormModal
            title={''}
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
