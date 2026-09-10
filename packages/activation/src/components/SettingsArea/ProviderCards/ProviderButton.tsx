import { c } from 'ttag';

import type { ButtonProps } from '@proton/atoms/Button/Button';
import { Button } from '@proton/atoms/Button/Button';
import clsx from '@proton/utils/clsx';

import type { ProviderDisplay } from '../../../constants';
import { EasySwitchProviderName } from '../../ProviderName/EasySwitchProviderName';

interface Props extends ButtonProps {
    provider: ProviderDisplay;
}

const ProviderButton = ({ className, provider, ...rest }: Props) => {
    const providerName = provider.getName();
    return (
        <Button className={clsx(className)} aria-label={c('Import provider').t`Import from ${providerName}`} {...rest}>
            <EasySwitchProviderName provider={provider} />
        </Button>
    );
};

export default ProviderButton;
