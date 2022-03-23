import { c } from 'ttag';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import { Row, Label, Field, Href } from '../../../components';

const ProtonVPNResourcesSection = () => {
    return (
        <>
            <Row>
                <Label>{c('Label').t`Download ${VPN_APP_NAME}`}</Label>
                <Field>
                    <Href url="https://protonvpn.com/download">{c('Link').t`Download page`}</Href>
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`${VPN_APP_NAME} homepage`}</Label>
                <Field>
                    <Href url="https://protonvpn.com/">{c('Link').t`Homepage`}</Href>
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Get support for ${VPN_APP_NAME}`}</Label>
                <Field>
                    <Href url="https://protonvpn.com/support">{c('Link').t`Support page`}</Href>
                </Field>
            </Row>
        </>
    );
};

export default ProtonVPNResourcesSection;
