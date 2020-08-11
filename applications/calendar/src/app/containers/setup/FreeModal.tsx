import { c } from 'ttag';
import { Alert, FormModal, useAppLink } from 'react-components';
import React from 'react';
import betaSvg from 'design-system/assets/img/pm-images/beta.svg';
import { APPS } from 'proton-shared/lib/constants';

const FreeModal = (props: any) => {
    const goToApp = useAppLink();
    const goBack = () => {
        goToApp('/', APPS.PROTONMAIL);
    };
    return (
        <FormModal
            title={c('Title').t`Welcome to ProtonCalendar`}
            hasClose={false}
            close={null}
            submit={c('Action').t`Back to ProtonMail`}
            {...props}
            onSubmit={goBack}
            onClose={goBack}
            small
        >
            <div className="aligncenter">
                <img src={betaSvg} alt="Beta" />
                <p>{c('Info')
                    .t`ProtonCalendar is currently in Beta and is only available to paid users of ProtonMail.`}</p>
            </div>
            <Alert>{c('Info')
                .t`If you only would like to participate in our Beta program today, consider upgrading to a paid plan. ProtonCalendar will be available to free users upon launch.`}</Alert>
        </FormModal>
    );
};

export default FreeModal;
