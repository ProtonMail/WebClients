import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';

import voucherThumbnail from '../../assets/images/voucher-thumbnail.svg';

const LEARN_MORE_URL = 'https://proton.me/support/mail-reservation-voucher';

const VoucherInformation = () => {
    const learnMoreLink = (
        <Href href={LEARN_MORE_URL} key="born-private-article-link" className="text-underline color-primary">
            {c('Link').t`Learn more`}
        </Href>
    );

    return (
        <div className="flex flex-nowrap items-center gap-6 mt-4">
            <img src={voucherThumbnail} alt="" width={70} height={90} className="shrink-0" />
            <span className="color-weak text-wrap-balance">
                {c('Info')
                    .jt`Receive the reservation voucher by email. You or the child can use it to activate the address within the next 15 years. ${learnMoreLink}`}
            </span>
        </div>
    );
};
export default VoucherInformation;
