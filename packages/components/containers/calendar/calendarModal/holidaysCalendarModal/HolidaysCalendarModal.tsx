import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useGetHolidaysDirectory } from '@proton/calendar/holidaysDirectory/hooks';
import Form from '@proton/components/components/form/Form';
import { CALENDAR_MODAL_TYPE } from '@proton/components/containers/calendar/calendarModal/interface';
import type {
    CalendarBootstrap,
    HolidaysDirectoryCalendar,
    VisualCalendar,
} from '@proton/shared/lib/interfaces/calendar';

import type { ModalProps } from '../../../../components';
import { Loader, ModalTwo as Modal, ModalTwoContent, ModalTwoFooter } from '../../../../components';
import { useGetCalendarBootstrap } from '../../../../hooks';
import GenericError from '../../../error/GenericError';
import HolidaysCalendarModalWithDirectory from './HolidaysCalendarModalWithDirectory';

interface Props extends ModalProps {
    /**
     * Calendar the user wants to update
     */
    calendar?: VisualCalendar;
    /**
     * Holidays calendars the user has already joined
     */
    holidaysCalendars: VisualCalendar[];
    type?: CALENDAR_MODAL_TYPE;
    onEditCalendar?: () => void;
}

const HolidaysCalendarModal = ({
    calendar,
    holidaysCalendars,
    type = CALENDAR_MODAL_TYPE.COMPLETE,
    onEditCalendar,
    ...rest
}: Props) => {
    const getCalendarBootstrap = useGetCalendarBootstrap();
    const getHolidaysDirectory = useGetHolidaysDirectory();

    const [directory, setDirectory] = useState<HolidaysDirectoryCalendar[] | undefined>();
    const [bootstrap, setBootstrap] = useState<CalendarBootstrap | undefined>();
    const [error, setError] = useState<Error | undefined>();

    useEffect(() => {
        const run = async () => {
            try {
                const getHolidaysDirectoryPromise = getHolidaysDirectory().then((directory) => {
                    setDirectory(directory);
                });
                const promises = [getHolidaysDirectoryPromise];
                if (calendar) {
                    const getCalendarBootstrapPromise = getCalendarBootstrap(calendar.ID).then(
                        (bootstrap: CalendarBootstrap) => {
                            setBootstrap(bootstrap);
                        }
                    );
                    promises.push(getCalendarBootstrapPromise);
                }
                void (await Promise.all(promises));
            } catch (e: any) {
                const error = e instanceof Error ? e : new Error('Unknown error loading holidays directory');
                setError(error);
            }
        };

        void run();
    }, []);

    if (error) {
        return (
            <Modal as={Form} fullscreenOnMobile size="large" {...rest}>
                <ModalTwoContent className="calendar-modal-content">
                    <GenericError />
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button onClick={() => window.location.reload()} className="ml-auto" color="norm">
                        {c('Action').t`Close`}
                    </Button>
                </ModalTwoFooter>
            </Modal>
        );
    }

    if (!directory || (calendar && !bootstrap)) {
        return (
            <Modal as={Form} fullscreenOnMobile size="large" {...rest}>
                <Loader />
            </Modal>
        );
    }

    return (
        <HolidaysCalendarModalWithDirectory
            calendar={calendar}
            calendarBootstrap={bootstrap}
            holidaysCalendars={holidaysCalendars}
            directory={directory}
            type={type}
            onEditCalendar={onEditCalendar}
            {...rest}
        />
    );
};

export default HolidaysCalendarModal;
