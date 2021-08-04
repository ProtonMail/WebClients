import { c } from 'ttag';
import { APPS } from '@proton/shared/lib/constants';

import { Label, Row, Field, Href } from '../../components';
import { useUser, useConfig } from '../../hooks';

const UsernameSection = () => {
    const { APP_NAME } = useConfig();
    const [{ Name, Email }] = useUser();

    if (APP_NAME === APPS.PROTONVPN_SETTINGS) {
        return (
            <>
                {Name ? (
                    <Row>
                        <Label>{c('Label').t`Name`}</Label>
                        <Field className="pt0-5">
                            <strong>{Name}</strong>
                        </Field>
                    </Row>
                ) : null}
                <Row>
                    <Label>{c('Label').t`ProtonMail address`}</Label>
                    <Field className="pt0-5">
                        {Email ? (
                            <strong>{Email}</strong>
                        ) : (
                            <Href
                                url="https://mail.protonmail.com/login"
                                title={c('Info').t`Log in to ProtonMail to activate your address`}
                            >{c('Link').t`Not activated`}</Href>
                        )}
                    </Field>
                </Row>
            </>
        );
    }

    return (
        <>
            {Name ? (
                <Row>
                    <Label>{c('Label').t`Name`}</Label>
                    <Field className="pt0-5">
                        <strong>{Name}</strong>
                    </Field>
                </Row>
            ) : (
                <Row>
                    <Label>{c('Label').t`Email address`}</Label>
                    <Field className="pt0-5">
                        <strong>{Email}</strong>
                    </Field>
                </Row>
            )}
        </>
    );
};

export default UsernameSection;
