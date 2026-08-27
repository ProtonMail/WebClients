import americanExpressIcon from '@proton/styles/assets/img/credit-card-icons/cc-american-express.svg';
import dankortIcon from '@proton/styles/assets/img/credit-card-icons/cc-dankort.svg';
import dinersClubIcon from '@proton/styles/assets/img/credit-card-icons/cc-diners-club.svg';
import discoverIcon from '@proton/styles/assets/img/credit-card-icons/cc-discover.svg';
import forbrugsIcon from '@proton/styles/assets/img/credit-card-icons/cc-forbrugs.svg';
import jcbIcon from '@proton/styles/assets/img/credit-card-icons/cc-jcb.svg';
import maestroIcon from '@proton/styles/assets/img/credit-card-icons/cc-maestro.svg';
import masterIcon from '@proton/styles/assets/img/credit-card-icons/cc-master.svg';
import mastercardIcon from '@proton/styles/assets/img/credit-card-icons/cc-mastercard.svg';
import paypalIcon from '@proton/styles/assets/img/credit-card-icons/cc-paypal.svg';
import unionpayIcon from '@proton/styles/assets/img/credit-card-icons/cc-unionpay.svg';
import visaElectronIcon from '@proton/styles/assets/img/credit-card-icons/cc-visa-electron.svg';
import visaIcon from '@proton/styles/assets/img/credit-card-icons/cc-visa.svg';

const banksMap = {
    discover: discoverIcon,
    master: masterIcon,
    'visa-electron': visaElectronIcon,
    'american-express': americanExpressIcon,
    forbrugs: forbrugsIcon,
    mastercard: mastercardIcon,
    visa: visaIcon,
    dankort: dankortIcon,
    jcb: jcbIcon,
    paypal: paypalIcon,
    'diners-club': dinersClubIcon,
    maestro: maestroIcon,
    unionpay: unionpayIcon,
};

export type CreditCardType = keyof typeof banksMap;

export const getBankSvg = (type: CreditCardType): string | undefined => {
    return banksMap[type];
};
