import { CalendarLogo, DriveLogo, MailLogo, VpnLogo } from '@proton/components/components';

const ProtonLogos = () => (
    <div className="text-center">
        <MailLogo variant="glyph-only" className="offer-proton-logo" size={40} />
        <CalendarLogo variant="glyph-only" className="offer-proton-logo" size={40} />
        <DriveLogo variant="glyph-only" className="offer-proton-logo" size={40} />
        <VpnLogo variant="glyph-only" className="offer-proton-logo" size={40} />
    </div>
);

export default ProtonLogos;
