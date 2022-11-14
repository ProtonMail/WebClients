import { c } from 'ttag';

import { BRAND_NAME, MAIL_APP_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';

import { Alert, Field, Href, Label, Row } from '../../../components';
import { useUser } from '../../../hooks';

const ProtonVPNCredentialsSection = () => {
    const [user] = useUser();

    const username = user.isMember ? user.Email : user.Name;

    const downloadLink = (
        <Href key="link" className="mr0-5" url="https://protonvpn.com/download">{c('Link')
            .t`${VPN_APP_NAME} native clients`}</Href>
    );

    return (
        <>
            <Alert className="mb1">{c('Info')
                .jt`Use the following credentials to log into the ${downloadLink}.`}</Alert>
            <Row>
                <Label>{c('Label').t`${BRAND_NAME} username`}</Label>
                <Field className="mt0-5">
                    <strong>{username}</strong>
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Password`}</Label>
                <Field className="mt0-5">
                    <strong>{c('Info').t`Same as ${MAIL_APP_NAME} login password`}</strong>
                </Field>
            </Row>
        </>
    );
};

export default ProtonVPNCredentialsSection;
