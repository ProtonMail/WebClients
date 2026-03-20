import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { IcCheckmarkCircle } from '@proton/icons/icons/IcCheckmarkCircle';
import { DRIVE_APP_NAME, MAIL_APP_NAME, SSO_PATHS } from '@proton/shared/lib/constants';
import { stringifySearchParams } from '@proton/shared/lib/helpers/url';

import BornPrivateFormHeading from '../../components/form/BornPrivateFormHeading';
import ConfirmationShareLinks from './ConfirmationShareLinks';
import type { VoucherDisplayProps } from './VoucherDisplay';
import VoucherDisplay from './VoucherDisplay';

import './EmailConfirmation.scss';

const EmailConfirmation = ({ reservedEmail, activationCode }: VoucherDisplayProps) => {
    return (
        <main className="flex flex-1 *:min-size-auto flex-column flex-nowrap items-center gap-8 text-center">
            <div className="flex flex-column flex-nowrap items-center gap-2 text-center">
                <IcCheckmarkCircle size={12} className="color-primary icon-confirmation" />
                <BornPrivateFormHeading as="h1" data-testid="confirmation-heading">{c('Heading')
                    .t`We emailed you the voucher`}</BornPrivateFormHeading>
            </div>

            <div
                className="confirmation-two-column-show-mobile max-w-custom w-full"
                style={{ '--max-w-custom': '14rem' }}
            >
                <VoucherDisplay reservedEmail={reservedEmail} activationCode={activationCode} />
            </div>

            <div className="flex flex-column flex-nowrap *:min-size-auto items-center gap-2 text-center">
                <p className="text-center m-0 text-wrap-balance">
                    {c('Info')
                        .t`When you're ready to activate the address, scan the QR code or use the link in the voucher.`}
                </p>
                <p className="text-center m-0 text-wrap-balance">
                    {c('Info').t`Keep the voucher secure until needed, for example in ${DRIVE_APP_NAME}.`}
                </p>
            </div>
            <div
                className="flex flex-column flex-nowrap *:min-size-auto items-center gap-2 text-center max-w-custom w-full"
                style={{ '--max-w-custom': '20rem' }}
            >
                <ButtonLike
                    as={Href}
                    href={`${SSO_PATHS.MAIL_SIGNUP}${stringifySearchParams({ ref: 'bornprivatereserved' }, '?')}`}
                    shape="solid"
                    color="norm"
                    fullWidth
                    className="rounded-lg"
                    size="large"
                >
                    {c('Action').t`Get your own ${MAIL_APP_NAME} address`}
                </ButtonLike>
            </div>

            <div className="flex flex-column items-center gap-2 text-center">
                <p className="m-0 text-sm color-weak text-center text-wrap-balance">
                    {c('Info')
                        .t`Help other families give their kids a safe start online. Share this milestone and spread the word.`}
                </p>
                <ConfirmationShareLinks />
            </div>
        </main>
    );
};
export default EmailConfirmation;
