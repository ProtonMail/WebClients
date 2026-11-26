import type { ChangeEvent } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { Loader } from '@proton/atoms/Loader/Loader';
import Form from '@proton/components/components/form/Form';
import BasicModal from '@proton/components/components/modalTwo/BasicModal';
import { InputField as InputFieldTwo } from '@proton/components/components/v2/field/InputField';
import GenericError from '@proton/components/containers/error/GenericError';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import BusySlotsCheckbox from '../BusySlotsCheckbox';
import useSubscribeCalendarForm from './useSubscribeCalendarForm';

interface Props {
    open: boolean;
    onClose?: () => void;
    onExit?: () => void;
    onCreateCalendar?: (id: string) => void;
}

const SubscribedCalendarModal = ({ open, onClose, onExit, onCreateCalendar }: Props) => {
    const {
        calendarURL,
        changeCalendarURL,
        shareBusySlots,
        setShareBusySlots,
        errorText,
        isSubmitDisabled,
        loadingSetup,
        loading,
        hasError,
        submit,
        close: handleClose,
    } = useSubscribeCalendarForm({ onClose, onCreateCalendar });

    const {
        title,
        submitProps,
        errorContent = null,
        onSubmit,
    } = (() => {
        if (hasError) {
            const onSubmitError = () => window.location.reload();

            return {
                title: c('Title').t`Error`,
                errorContent: <GenericError />,
                onSubmit: onSubmitError,
                submitProps: {
                    children: c('Action').t`Close`,
                    disabled: isSubmitDisabled,
                },
            };
        }

        const titleAndSubmitCopy = c('Modal title and action').t`Add calendar`;

        return {
            title: titleAndSubmitCopy,
            onSubmit: submit,
            submitProps: {
                loading,
                children: titleAndSubmitCopy,
                disabled: isSubmitDisabled,
            },
        };
    })();

    const kbLink = (
        <Href key="kbLink" href={getKnowledgeBaseUrl('/subscribe-to-external-calendar')}>{c(
            'Subscribe to calendar modal description'
        ).t`Learn how to get a private calendar link.`}</Href>
    );

    return (
        <BasicModal
            title={title}
            footer={
                <>
                    <Button onClick={handleClose}>{c('Action').t`Cancel`}</Button>
                    <Button type="submit" color="norm" {...submitProps} />
                </>
            }
            isOpen={open}
            className="modal--shorter-labels w-full"
            onClose={handleClose}
            as={Form}
            dense
            onSubmit={() => {
                if (!submitProps.loading) {
                    void onSubmit();
                }
            }}
            onExit={onExit}
        >
            {loadingSetup ? (
                <Loader />
            ) : (
                errorContent || (
                    <>
                        <p className="mt-0 text-pre-wrap">{c('Subscribe to calendar modal')
                            .jt`To subscribe to an external or public calendar and its updates, enter the URL. A read-only version of the calendar will be added to your Other calendars.
${kbLink}
`}</p>
                        <InputFieldTwo
                            autoFocus
                            error={errorText}
                            label={c('Subscribe to calendar modal').t`Calendar URL`}
                            value={calendarURL}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => changeCalendarURL(e.target.value)}
                            data-testid="input:calendar-subscription"
                            className="mb-4"
                        />

                        <BusySlotsCheckbox value={shareBusySlots} onChange={setShareBusySlots} />
                    </>
                )
            )}
        </BasicModal>
    );
};

export default SubscribedCalendarModal;
