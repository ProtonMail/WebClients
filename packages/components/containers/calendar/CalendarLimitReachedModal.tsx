import React from 'react';
import { c } from 'ttag';
import { noop } from '@proton/shared/lib/helpers/function';
import { ButtonLike } from '../../components/button';
import { SettingsLink } from '../../components/link';
import { FormModal } from '../../components/modal';

interface Props {
    children: React.ReactNode;
}

const CalendarLimitReachedModal = ({ children, ...rest }: Props) => (
    <FormModal
        title={c('Modal title').t`Unable to add more calendars`}
        submit={
            <ButtonLike color="norm" as={SettingsLink} path="/calendars">
                {c('Modal action').t`Manage calendars`}
            </ButtonLike>
        }
        close={c('Modal action').t`Close`}
        onSubmit={noop}
        onClose={noop}
        {...rest}
    >
        {children}
    </FormModal>
);

export default CalendarLimitReachedModal;
