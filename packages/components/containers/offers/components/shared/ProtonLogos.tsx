import { CalendarLogo, DriveLogo, MailLogo, VpnLogo } from '@proton/components';

const ProtonLogos = () => (
    <div className="text-center">
        <MailLogo variant="glyph-only" className="offer-proton-logo" size={10} />
        <CalendarLogo variant="glyph-only" className="offer-proton-logo" size={10} />
        <DriveLogo variant="glyph-only" className="offer-proton-logo" size={10} />
        <VpnLogo variant="glyph-only" className="offer-proton-logo" size={10} />
    </div>
);

export default ProtonLogos;
