import { PLANS } from '@proton/payments';

import BundleIcon from '../components/PlanSelector/icons/bundle.svg';
import DriveIcon from '../components/PlanSelector/icons/drive.svg';
import FreeLogo from '../components/PlanSelector/icons/free.svg';
import MailIcon from '../components/PlanSelector/icons/mail.svg';
import PassIcon from '../components/PlanSelector/icons/pass.svg';
import VpnIcon from '../components/PlanSelector/icons/vpn.svg';

export const getPlanIconPath = (planName: PLANS): string => {
    switch (planName) {
        case PLANS.BUNDLE:
            return BundleIcon;
        case PLANS.MAIL:
            return MailIcon;
        case PLANS.DRIVE:
            return DriveIcon;
        case PLANS.PASS:
            return PassIcon;
        case PLANS.VPN2024:
            return VpnIcon;
        default:
            return FreeLogo;
    }
};
