import CalendarLogo from '@proton/components/components/logo/CalendarLogo';
import DriveLogo from '@proton/components/components/logo/DocsLogo';
import MailLogo from '@proton/components/components/logo/MailLogo';
import VpnLogo from '@proton/components/components/logo/VpnLogo';

const ProtonLogos = () => (
    <div className="text-center">
        <MailLogo variant="glyph-only" className="offer-proton-logo" size={10} />
        <CalendarLogo variant="glyph-only" className="offer-proton-logo" size={10} />
        <DriveLogo variant="glyph-only" className="offer-proton-logo" size={10} />
        <VpnLogo variant="glyph-only" className="offer-proton-logo" size={10} />
    </div>
);

export default ProtonLogos;
