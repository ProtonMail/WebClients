import { CalendarLogo, DriveLogo, MailLogo, VpnLogo } from '@proton/components/components';

const ProtonLogos = () => (
    <div className="text-center">
        <MailLogo variant="glyph-only" className="offer-proton-logo" size={60} />
        <CalendarLogo variant="glyph-only" className="offer-proton-logo" size={60} />
        <DriveLogo variant="glyph-only" className="offer-proton-logo" size={60} />
        <VpnLogo variant="glyph-only" className="offer-proton-logo" size={60} />
    </div>
);

export default ProtonLogos;
