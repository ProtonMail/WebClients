import { c } from 'ttag';

import { Href } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import Field from '@proton/components/components/container/Field';
import Row from '@proton/components/components/container/Row';
import Label from '@proton/components/components/label/Label';
import { BRAND_NAME, MAIL_APP_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';

import { useUser } from '../../../hooks';

const ProtonVPNCredentialsSection = () => {
    const [user] = useUser();

    const username = user.isMember ? user.Email : user.Name;

    const downloadLink = (
        <Href key="link" className="mr-2" href="https://protonvpn.com/download">{c('Link')
            .t`${VPN_APP_NAME} native clients`}</Href>
    );

    return (
        <>
            <Alert className="mb-4">{c('Info')
                .jt`Use the following credentials to log into the ${downloadLink}.`}</Alert>
            <Row>
                <Label>{c('Label').t`${BRAND_NAME} username`}</Label>
                <Field className="mt-2">
                    <strong>{username}</strong>
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Password`}</Label>
                <Field className="mt-2">
                    <strong>{c('Info').t`Same as ${MAIL_APP_NAME} login password`}</strong>
                </Field>
            </Row>
        </>
    );
};

export default ProtonVPNCredentialsSection;
