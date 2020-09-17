import { c } from 'ttag';
import { Alert, AppLink, FormModal, useAppLink } from 'react-components';
import React from 'react';
import betaSvg from 'design-system/assets/img/pm-images/beta.svg';
import { APPS } from 'proton-shared/lib/constants';
import { getAccountSettingsApp } from 'proton-shared/lib/apps/helper';

const FreeModal = (props: any) => {
    const goToApp = useAppLink();
    const goBack = () => {
        goToApp('/', APPS.PROTONMAIL);
    };
    const upgradingLink = (
        <AppLink target="_self" to="/subscription" toApp={getAccountSettingsApp()}>{c('Info')
            .t`upgrading to a paid plan`}</AppLink>
    );
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
                .jt`If you would like to participate in our Beta program, consider ${upgradingLink}. ProtonCalendar will be available to free users upon launch.`}</Alert>
        </FormModal>
    );
};

export default FreeModal;
