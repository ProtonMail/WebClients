import { c } from 'ttag';
import { Row, Label, Field, Href } from '../../../components';

const ProtonVPNResourcesSection = () => {
    return (
        <>
            <Row>
                <Label>{c('Label').t`Download ProtonVPN`}</Label>
                <Field>
                    <Href url="https://protonvpn.com/download">{c('Link').t`Download page`}</Href>
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`ProtonVPN homepage`}</Label>
                <Field>
                    <Href url="https://protonvpn.com/">{c('Link').t`Homepage`}</Href>
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Get support for ProtonVPN`}</Label>
                <Field>
                    <Href url="https://protonvpn.com/support">{c('Link').t`Support page`}</Href>
                </Field>
            </Row>
        </>
    );
};

export default ProtonVPNResourcesSection;
