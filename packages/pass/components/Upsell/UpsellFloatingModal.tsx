import { type FC, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalTwoHeader } from '@proton/components';
import PassLogo from '@proton/components/components/logo/PassLogo';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { PASS_BLOG_TRIAL_URL } from '@proton/pass/constants';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import './UpsellFloatingModal.scss';

type UpsellFloatingModalProps = {
    className?: string;
    title: string;
    subtitle?: string;
    badgeText?: string;
};

export const UpsellFloatingModal: FC<UpsellFloatingModalProps> = ({ className, title, subtitle, badgeText }) => {
    const { onLink } = usePassCore();
    const [showModal, setShowModal] = useState(true);

    return (
        <div
            className={clsx(
                'fixed bottom-custom right-custom rounded-xl overflow-hidden',
                showModal ? className : 'hidden'
            )}
            style={{ '--bottom-custom': '2rem', '--right-custom': '2rem' }}
        >
            <div className="w-custom" style={{ '--w-custom': '20rem' }}>
                <header className="pass-upsell-floating-modal--header p-10">
                    <ModalTwoHeader
                        closeButtonProps={{ pill: true, icon: true }}
                        className="absolute top-custom right-custom"
                        style={{ '--top-custom': '1rem', '--right-custom': '1rem' }}
                        onClick={() => setShowModal(false)}
                    />
                    <PassLogo
                        width={300}
                        height={80}
                        style={{ '--logo-text-product-color': 'white', '--logo-text-proton-color': 'white' }}
                    />
                </header>
                <div className="pass-upsell-floating-modal--content text-left flex flex-column items-start gap-2 p-4 color-invert">
                    {badgeText && (
                        <span className="pass-upsell-floating-modal--label rounded-lg text-bold text-sm py-1 px-4">
                            {badgeText}
                        </span>
                    )}

                    <h1 className="text-lg text-bold">{title}</h1>
                    {subtitle && <span className="text-sm">{subtitle}</span>}

                    <Button
                        className="pass-upsell-floating-modal--button w-full mt-2"
                        color="norm"
                        size="large"
                        shape="solid"
                        onClick={() => onLink(PASS_BLOG_TRIAL_URL)}
                    >
                        {c('Action').t`Get ${PASS_APP_NAME}`}
                    </Button>
                </div>
            </div>
        </div>
    );
};
