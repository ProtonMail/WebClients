import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { useFlag } from '@proton/unleash/useFlag';

import { getMarketingUrl } from '../../util/marketingUrls';

interface LumoB2BUpsellLinkProps {
    className: string;
    children?: React.ReactNode;
}
const LumoB2BUpsellLink = ({ className, children }: LumoB2BUpsellLinkProps) => {
    const showNewMarketingLinks = useFlag('LumoNewMarketingLinks');
    return (
        <Href
            href={showNewMarketingLinks ? getMarketingUrl('/business/lumo') : 'https://lumo.proton.me/business'}
            className={className}
        >
            {children || c('collider_2025: Top nav link').t`For Business`}
        </Href>
    );
};

export default LumoB2BUpsellLink;
