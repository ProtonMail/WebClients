import { c } from 'ttag';

import { APPS } from '@proton/shared/lib/constants';
import envelopSvg from '@proton/styles/assets/img/illustrations/welcome-pane.svg';

import Bordered from '../../components/container/Bordered';
import { useConfig } from '../../hooks';

const Cash = () => {
    const { APP_NAME } = useConfig();
    const email = (
        <b key="email-contact">
            {APP_NAME === APPS.PROTONVPN_SETTINGS ? 'contact@protonvpn.com' : 'contact@proton.me'}
        </b>
    );

    return (
        <Bordered className="bg-weak rounded">
            <div className="mb-4">{c('Info for cash payment method')
                .jt`Please contact us at ${email} for instructions on how to pay us with cash.`}</div>
            <div className="text-center">
                <img src={envelopSvg} alt="" />
            </div>
        </Bordered>
    );
};

export default Cash;
