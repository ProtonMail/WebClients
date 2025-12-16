import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';

interface LumoB2BUpsellLinkProps {
    className: string;
    children?: React.ReactNode;
}
const LumoB2BUpsellLink = ({ className, children }: LumoB2BUpsellLinkProps) => {
    return (
        <Href href="https://lumo.proton.me/business" className={className}>
            {children || c('collider_2025: Top nav link').t`For Business`}
        </Href>
    );
};

export default LumoB2BUpsellLink;
