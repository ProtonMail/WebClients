import { useEffect } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms/Button';
import {
    AlertModal,
    GenericError,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    PrimaryButton,
    SettingsLink,
    useApi,
    useCache,
    useGetAddressKeys,
    useGetAddresses,
    useLoading,
    useModalState,
} from '@proton/components';
import { getPersonalCalendars } from '@proton/shared/lib/calendar/calendar';
import { CALENDAR_FLAGS } from '@proton/shared/lib/calendar/constants';
import { process } from '@proton/shared/lib/calendar/crypto/keys/resetHelper';
import { getCalendarsSettingsPath } from '@proton/shared/lib/calendar/settingsRoutes';
import { APPS, APPS_CONFIGURATION } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import CalendarReactivateSection from './CalendarReactivateSection';
import CalendarResetSection from './CalendarResetSection';

interface FilteredCalendars {
    calendarsToReset: VisualCalendar[];
    calendarsToReactivate: VisualCalendar[];
}

interface Props {
    calendars: VisualCalendar[];
    unlockAll: boolean;
    onDone: () => void;
}
const UnlockCalendarsModal = ({ calendars, unlockAll, onDone, ...rest }: Props) => {
    const api = useApi();
    const cache = useCache();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();

    const { calendarsToReset, calendarsToReactivate } = calendars.reduce<FilteredCalendars>(
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

    const hasCalendarsToReset = calendarsToReset.length > 0;
    const hasCalendarsToReactivate = calendarsToReactivate.length > 0;

    const [errorModal, setErrorModalOpen, renderErrorModal] = useModalState();
    const [resetModal, setResetModalOpen, renderResetModal] = useModalState();
    const [reshareModal, setReshareModalOpen, renderReshareModal] = useModalState();
    const [reactivateModal, setReactivateModalOpen, renderReactivateModal] = useModalState();

    const [isLoading, withLoading] = useLoading(false);

    useEffect(() => {
        if (hasCalendarsToReactivate) {
            setReactivateModalOpen(true);
        } else if (hasCalendarsToReset) {
            setResetModalOpen(true);
        }
    }, []);

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

    const handleError = () => window.location.reload();
    const handleReset = () => {
        handleProcess()
            .then((hasSharedCalendars = false) => {
                if (hasSharedCalendars) {
                    setResetModalOpen(false);
                    setReshareModalOpen(true);
                } else {
                    onDone();
                }
            })
            .catch((error) => {
                console.error(error);
                setResetModalOpen(false);
                setErrorModalOpen(true);
            });
    };

    const handleReactivate = () => {
        handleProcess()
            .then(() => {
                if (hasCalendarsToReset) {
                    setReactivateModalOpen(false);
                    setResetModalOpen(true);
                    return;
                }
                onDone();
            })
            .catch((error) => {
                console.error(error);
                setReactivateModalOpen(false);
                setErrorModalOpen(true);
            });
    };

    const calendarAppBareName = APPS_CONFIGURATION[APPS.PROTONCALENDAR].bareName.toLowerCase();

    return (
        <>
            {renderErrorModal && (
                <Modal {...errorModal} {...rest}>
                    <ModalHeader title={c('Title').t`Error`} hasClose={false} />
                    <ModalContent>
                        <GenericError />
                    </ModalContent>
                    <ModalFooter>
                        <PrimaryButton type="submit" onClick={handleError}>{c('Action').t`Close`}</PrimaryButton>
                    </ModalFooter>
                </Modal>
            )}
            {renderResetModal && (
                <Modal {...resetModal} {...rest} size="large">
                    <ModalHeader
                        title={
                            unlockAll
                                ? c('Title').t`We've locked your calendars to protect your data`
                                : c('Title').t`We've locked some calendars to protect your data`
                        }
                        hasClose={false}
                    />
                    <ModalContent>
                        <CalendarResetSection
                            calendarsToReset={getPersonalCalendars(calendarsToReset)}
                            resetAll={unlockAll}
                        />
                    </ModalContent>
                    <ModalFooter>
                        <ButtonLike as={SettingsLink} path={'/recovery'}>
                            {c('Action').t`Recover data`}
                        </ButtonLike>
                        <PrimaryButton type="submit" loading={isLoading} onClick={handleReset}>
                            {c('Action').t`Continue to ${calendarAppBareName}`}
                        </PrimaryButton>
                    </ModalFooter>
                </Modal>
            )}
            {renderReshareModal && (
                <AlertModal
                    {...reshareModal}
                    {...rest}
                    title={c('Title').t`Reshare your calendars`}
                    buttons={[
                        <ButtonLike as={SettingsLink} type="submit" color="norm" path={getCalendarsSettingsPath()}>
                            {c('Action').t`Open settings`}
                        </ButtonLike>,
                        <Button onClick={onDone}>{c('Action').t`Close`}</Button>,
                    ]}
                >
                    <p>
                        {c('Info; reshare calendar modal; part 1')
                            .t`Calendar sharing was disabled following your recent password reset.`}
                    </p>
                    <p>{c('Info; reshare calendar modal; part 2').t`You can reshare your calendars in settings.`}</p>
                </AlertModal>
            )}
            {renderReactivateModal && (
                <Modal {...reactivateModal} {...rest}>
                    <ModalHeader title={c('Title').t`Reactivate calendar keys`} hasClose={false} />
                    <ModalContent>
                        <CalendarReactivateSection calendarsToReactivate={calendarsToReactivate} />
                    </ModalContent>
                    <ModalFooter>
                        <Button onClick={onDone}>{c('Action').t`Cancel`}</Button>
                        <PrimaryButton type="submit" loading={isLoading} onClick={handleReactivate}>
                            {c('Action').t`Got it`}
                        </PrimaryButton>
                    </ModalFooter>
                </Modal>
            )}
        </>
    );
};

export default UnlockCalendarsModal;
