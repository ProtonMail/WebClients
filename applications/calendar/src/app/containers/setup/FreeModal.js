import { c } from 'ttag';
import { Alert, FormModal } from 'react-components';
import React from 'react';
import betaSvg from 'design-system/assets/img/pm-images/beta.svg';
import { redirectTo } from 'proton-shared/lib/helpers/browser';

const FreeModal = (props) => {
    const goBack = () => {
        redirectTo('/inbox');
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
            small={true}
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
