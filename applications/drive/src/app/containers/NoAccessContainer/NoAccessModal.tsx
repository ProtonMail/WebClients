import { c } from 'ttag';
import { Alert, FormModal, useAppLink } from 'react-components';
import React from 'react';
import noContentSvgLight from 'design-system/assets/img/pd-images/no-content.svg';
import noContentSvgDark from 'design-system/assets/img/pd-images/no-content-dark.svg';
import { APPS } from 'proton-shared/lib/constants';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';

const NoAccessModal = (props: any) => {
    const goToApp = useAppLink();
    const goBack = () => {
        goToApp('/', APPS.PROTONMAIL);
    };
    return (
        <FormModal
            title={c('Title').t`Welcome to ProtonDrive`}
            hasClose={false}
            close={null}
            submit={c('Action').t`Back to ProtonMail`}
            {...props}
            onSubmit={goBack}
            onClose={goBack}
            small
        >
            <div className="aligncenter">
                <img
                    src={getLightOrDark(noContentSvgLight, noContentSvgDark)}
                    alt={c('Info').t`Drive Beta`}
                    style={{ maxWidth: 200 }}
                />

                <p>{c('Info')
                    .t`ProtonDrive is currently in Beta and is only available to the invited users of ProtonMail.`}</p>
            </div>

            <Alert>{c('Info').t`ProtonDrive will be available to all users upon launch.`}</Alert>
        </FormModal>
    );
};

export default NoAccessModal;
