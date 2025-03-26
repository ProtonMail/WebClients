import Lottie from 'lottie-react';

import animationData from './vpn-ip-encryption.json';

const VPNAnimation = () => {
    return <Lottie autoPlay animationData={animationData} loop={true} />;
};

export default VPNAnimation;
