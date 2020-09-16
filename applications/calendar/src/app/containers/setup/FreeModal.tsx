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
    const goUpgrade = () => {
        goToApp('/subscription', APPS.PROTONACCOUNT);
    };
    const upgradingLink = (
        // using button here breaks text formatting
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <a role="button" onClick={goUpgrade} tabIndex={0} href="#">{c('Info').t`upgrading to a paid plan`}</a>
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
