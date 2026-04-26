import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import recoverDataBannerLockSvg from './recover-data-banner-lock.svg';

interface Props {
    onDismiss: () => void;
    onReactivate: () => void;
}

const kbHref = getKnowledgeBaseUrl('/recover-encrypted-messages-files');

const RecoverDataBanner = ({ onDismiss, onReactivate }: Props) => {
    const recoveryMethodLink = (
        <Href key="recovery-method" href={kbHref}>
            {c('Link').t`use a data recovery method`}
        </Href>
    );

    return (
        <section className="rounded-xl bg-elevated p-4 shadow-norm flex flex-column gap-2 lg:flex-row lg:items-center lg:gap-8 text-center lg:text-left justify-center lg:justify-start">
            <div className="shrink-0 mx-auto lg:mx-0">
                <img src={recoverDataBannerLockSvg} width={64} height={64} alt="" className="block shrink-0" />
            </div>

            <div className="flex lg:flex-1 flex-column flex-wrap gap-1">
                <p className="m-0 text-rg text-semibold">{c('Title').t`Some of your encrypted data is locked`}</p>
                <p className="m-0 text-sm color-weak">
                    {c('Info')
                        .jt`If you recently reset your password, you can ${recoveryMethodLink} to unlock your data. If this is due to an old password reset, you can stop the message from showing again.`}
                </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 flex-column xl:flex-row w-auto">
                <Button color="weak" shape="outline" onClick={onDismiss}>
                    {c('Action').t`Don't show again`}
                </Button>
                <Button color="norm" shape="solid" onClick={onReactivate}>
                    {c('Action').t`Unlock data`}
                </Button>
            </div>
        </section>
    );
};

export default RecoverDataBanner;
