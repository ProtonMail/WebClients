import { c } from 'ttag';

const OrganizationLogoTips = () => {
    return (
        <ul className="my-1">
            <li className="my-2">{c('Organization logo upload').t`Use a graphical icon or image rather than text.`}</li>
            <li className="my-2">{c('Organization logo upload').t`Ensure your logo has padding space around it.`}</li>
            <li className="my-2">{c('Organization logo upload').t`Use a solid background color.`}</li>
            <li className="my-2">{c('Organization logo upload').t`Avoid overly compressed images.`}</li>
            <li className="my-2">{c('Organization logo upload')
                .t`Opt for a PNG image that is a 128x128 pixels for clarity.`}</li>
        </ul>
    );
};

export default OrganizationLogoTips;
