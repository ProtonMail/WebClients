import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { IcBrandFacebook } from '@proton/icons/icons/IcBrandFacebook';
import { IcBrandLinkedin } from '@proton/icons/icons/IcBrandLinkedin';
import { IcBrandTwitter } from '@proton/icons/icons/IcBrandTwitter';
import { IcEnvelopeOpen } from '@proton/icons/icons/IcEnvelopeOpen';

const ConfirmationShareLinks = () => {
    const xURL = `https://x.com/ProtonMail`;
    const linkedInURL = `https://www.linkedin.com/company/protonprivacy/`;
    const facebookURL = `https://www.facebook.com/Proton/`;
    const mailtoURL = `mailto:`;

    const linkClass = 'color-weak hover:color-norm p-2 lg:p-4';

    return (
        <div className="flex gap-1 lg:gap-2 justify-center">
            <Href href={xURL} className={linkClass} rel="noopener noreferrer">
                <IcBrandTwitter size={6} alt={c('Link label').t`Twitter (X)`} />
            </Href>
            <Href href={linkedInURL} className={linkClass} rel="noopener noreferrer">
                <IcBrandLinkedin size={6} alt={c('Link label').t`LinkedIn`} />
            </Href>
            <Href href={mailtoURL} className={linkClass}>
                <IcEnvelopeOpen size={6} alt={c('Link label').t`Email`} />
            </Href>
            <Href href={facebookURL} className={linkClass} rel="noopener noreferrer">
                <IcBrandFacebook size={6} alt={c('Link label').t`Facebook`} />
            </Href>
        </div>
    );
};

export default ConfirmationShareLinks;
