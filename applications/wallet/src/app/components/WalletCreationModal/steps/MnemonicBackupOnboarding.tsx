import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { Button, ButtonLike } from '../../../atoms';
import accessKey from './access-key.svg';

interface Props {
    onViewMnemonic: () => void;
}

export const MnemonicBackupOnboarding = ({ onViewMnemonic }: Props) => {
    return (
        <div className="flex flex-column">
            <img src={accessKey} alt="icon of an access key" />

            <p className="color-weak text-center mx-12">
                <span className="block my-2">{c('Wallet setup')
                    .t`Wallet seed phrases encode the private key that controls your digital assets.`}</span>
                <span className="block my-2">{c('Wallet setup')
                    .t`These 12 words should only be used to recover the digital assets of this wallet as a last resort, such as if you lose access to your ${BRAND_NAME} account.`}</span>
                <span className="block my-2">{c('Wallet setup')
                    .t`Never give them to anyone else. ${BRAND_NAME} will never ask for them. Write them down carefully and hide it in a safe place.`}</span>
            </p>

            <Button className="block w-4/5 mx-auto mb-2" shape="solid" color="norm" onClick={() => onViewMnemonic()}>
                {c('Wallet setup').t`View wallet seed phrase`}
            </Button>

            <ButtonLike
                as={Href}
                href={getKnowledgeBaseUrl('/proton-wallet-seed-phrase')}
                target="_blank"
                className="block w-4/5 mx-auto text-semibold"
                shape="ghost"
                color="weak"
            >{c('Wallet setup').t`Learn more`}</ButtonLike>
        </div>
    );
};
