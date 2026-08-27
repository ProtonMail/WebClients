import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import CurrencySelector from '@proton/components/containers/payments/CurrencySelector';
import { usePaymentOptimistic } from '@proton/payments-ui/ui/context/PaymentContextOptimistic';
import { APPS } from '@proton/shared/lib/constants';
import { getPrivacyPolicyURL } from '@proton/shared/lib/helpers/url';
import { locales } from '@proton/shared/lib/i18n/locales';

import { getLocaleTermsURL } from '../../../../../content/helper';
import LanguageSelect from '../../../../../public/LanguageSelect';
import SignupSupportDropdown from '../../../../../signup/SignupSupportDropdown';

export const Footer = () => {
    const payments = usePaymentOptimistic();

    return (
        <footer
            className="flex justify-center items-center p-4 mt-auto"
            style={{
                '--link-norm': 'var(--text-weak)',
                '--primary': 'var(--text-weak)',
                '--interaction-norm-major-1': 'var(--text-weak)',
            }}
        >
            <Href
                key="privacy"
                className="signup-link link-focus text-no-decoration mr-6"
                href={getPrivacyPolicyURL(APPS.PROTONDRIVE)}
            >{c('Link').t`Privacy policy`}</Href>
            <Href
                key="terms"
                className="signup-link link-focus text-no-decoration mr-6"
                href={getLocaleTermsURL(APPS.PROTONDRIVE)}
            >
                {c('Link').t`Terms`}
            </Href>
            <SignupSupportDropdown />
            <div>
                <CurrencySelector
                    currencies={payments.availableCurrencies}
                    currency={payments.checkoutUi.currency}
                    onSelect={payments.selectCurrency}
                    mode="select-two"
                    className="color-primary interactive-pseudo interactive--no-background border-none ml-2"
                />
            </div>
            <LanguageSelect locales={locales} globe={true} className="ml-3" />
        </footer>
    );
};
