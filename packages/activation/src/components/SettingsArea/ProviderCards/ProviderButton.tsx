import { c } from 'ttag';

import { EasySwitchProviderName } from '@proton/activation/src/components/ProviderName/EasySwitchProviderName';
import { providerMap } from '@proton/activation/src/constants';
import type { ImportProvider } from '@proton/activation/src/interface';
import type { ButtonProps } from '@proton/atoms/Button/Button';
import { Button } from '@proton/atoms/Button/Button';
import clsx from '@proton/utils/clsx';

interface Props extends ButtonProps {
    provider: ImportProvider.OUTLOOK | ImportProvider.YAHOO | ImportProvider.GOOGLE;
}

const ProviderButton = ({ className, provider, ...rest }: Props) => {
    const providerName = providerMap[provider].getName();
    return (
        <Button className={clsx(className)} aria-label={c('Import provider').t`Import from ${providerName}`} {...rest}>
            <EasySwitchProviderName provider={provider} />
        </Button>
    );
};

export default ProviderButton;
