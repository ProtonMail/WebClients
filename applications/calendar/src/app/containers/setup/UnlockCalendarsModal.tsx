import { useEffect } from 'react';

import { c } from 'ttag';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useGetAddresses } from '@proton/account/addresses/hooks';
import { Button, ButtonLike } from '@proton/atoms';
import { useGetCalendarBootstrap } from '@proton/calendar/calendarBootstrap/hooks';
import { useGetCalendars } from '@proton/calendar/calendars/hooks';
import {
    GenericError,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    PrimaryButton,
    Prompt,
    SettingsLink,
    useApi,
    useConfig,
    useDrawer,
    useModalState,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import { getPersonalCalendars } from '@proton/shared/lib/calendar/calendar';
import { process } from '@proton/shared/lib/calendar/crypto/keys/resetHelper';
import { getCalendarsSettingsPath } from '@proton/shared/lib/calendar/settingsRoutes';
import { APPS, APPS_CONFIGURATION } from '@proton/shared/lib/constants';
import { closeDrawerFromChildApp } from '@proton/shared/lib/drawer/helpers';

import CalendarReactivateSection from './CalendarReactivateSection';
import CalendarResetSection from './CalendarResetSection';
import type { CalendarsToAct } from './helper';

interface Props {
    calendarsToAct: CalendarsToAct;
    unlockAll: boolean;
    onDone: () => void;
    hasReactivatedCalendarsRef: React.MutableRefObject<boolean>;
}

const UnlockCalendarsModal = ({
    calendarsToAct: { calendarsToReset, calendarsToClean, calendarsToReactivate },
    unlockAll,
    hasReactivatedCalendarsRef,
    onDone,
}: Props) => {
    const api = useApi();
    const getCalendars = useGetCalendars();
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
    const { parentApp } = useDrawer();
    const { APP_NAME: currentApp } = useConfig();

    const hasCalendarsToReset = calendarsToReset.length > 0;
    const hasCalendarsToReactivate = calendarsToReactivate.length > 0;
    const hasCalendarsToClean = calendarsToClean.length > 0;

    const [errorModal, setErrorModalOpen, renderErrorModal] = useModalState();
    const [resetModal, setResetModalOpen, renderResetModal] = useModalState();
    const [reshareModal, setReshareModalOpen, renderReshareModal] = useModalState();
    const [reactivateModal, setReactivateModalOpen, renderReactivateModal] = useModalState();

    const [isLoading, withLoading] = useLoading(false);

    const handleProcess = () => {
        return withLoading(
            process({
                api,
                getCalendars,
                getCalendarBootstrap,
                getAddressKeys,
                getAddresses,
                calendarsToReset,
                calendarsToReactivate,
                calendarsToClean,
            })
        );
    };

    useEffect(() => {
        if (hasCalendarsToReactivate) {
            setReactivateModalOpen(true);
        } else if (hasCalendarsToReset) {
            setResetModalOpen(true);
        } else if (hasCalendarsToClean) {
            // When user has only calendars to clean (e.g: holidays/shared), we want to do the process in the background
            void handleProcess().then(() => {
                onDone();
            });
        }
    }, []);

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
                hasReactivatedCalendarsRef.current = true;
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

    const closeDrawer = () => {
        if (parentApp) {
            closeDrawerFromChildApp(parentApp, currentApp, true);
        }
    };

    const calendarAppBareName = APPS_CONFIGURATION[APPS.PROTONCALENDAR].bareName.toLowerCase();

    return (
        <>
            {renderErrorModal && (
                <Modal {...errorModal}>
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
                <Modal {...resetModal} size="large" disableCloseOnEscape={true}>
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
                        <ButtonLike as={SettingsLink} path={'/recovery'} onClick={closeDrawer}>
                            {c('Action').t`Recover data`}
                        </ButtonLike>
                        <PrimaryButton type="submit" loading={isLoading} onClick={handleReset}>
                            {c('Action').t`Continue to ${calendarAppBareName}`}
                        </PrimaryButton>
                    </ModalFooter>
                </Modal>
            )}
            {renderReshareModal && (
                <Prompt
                    {...reshareModal}
                    title={c('Title').t`Reshare your calendars`}
                    buttons={[
                        <ButtonLike
                            as={SettingsLink}
                            type="submit"
                            color="norm"
                            path={getCalendarsSettingsPath()}
                            onClick={closeDrawer}
                        >
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
                </Prompt>
            )}
            {renderReactivateModal && (
                <Modal {...reactivateModal} disableCloseOnEscape={true}>
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
