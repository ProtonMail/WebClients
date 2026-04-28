import type { IconSize } from '@proton/icons/types';
import vpnPassLogoSvg from '@proton/styles/assets/img/illustrations/bundle-vpn-pass.svg';

interface VpnPassLogoProps {
    size?: IconSize;
}

const VpnPassLogo = ({ size = 15 }: VpnPassLogoProps) => {
    return <img src={vpnPassLogoSvg} alt="" className={`icon-size-${size}`} />;
};

export default VpnPassLogo;
