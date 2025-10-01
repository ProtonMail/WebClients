import { c } from 'ttag';

import { getStaticURL } from '@proton/shared/lib/helpers/url';
import envelopSvg from '@proton/styles/assets/img/illustrations/welcome-pane.svg';

import Bordered from '../../components/container/Bordered';

const Cash = () => {
    const howToSendCashArticleUrl = (
        <a
            href={getStaticURL('/support/payment-options#cash')}
            target="_blank"
            rel="noopener noreferrer"
            className="text-bold"
            key="how-to-send-cash-payment"
        >{c('Info for cash payment method').t`How to send a cash payment?`}</a>
    );

    return (
        <Bordered className="rounded">
            <div className="mb-4">{c('Info for cash payment method')
                .jt`Please find the instructions in the article: ${howToSendCashArticleUrl}`}</div>
            <div className="text-center">
                <img src={envelopSvg} alt="" />
            </div>
        </Bordered>
    );
};

export default Cash;
