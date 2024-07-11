import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import MiddleEllipsis from '@proton/components/components/ellipsis/MiddleEllipsis';
import Icon from '@proton/components/components/icon/Icon';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import bitcoinEmailActive from '@proton/styles/assets/img/illustrations/proton-wallet-active-email.svg';
import bitcoinEmailInactive from '@proton/styles/assets/img/illustrations/proton-wallet-inactive-email.svg';

import { CoreButton, CoreButtonLike } from '.';

interface Props {
    isActive: boolean;
    email?: string;
}

export const BitcoinViaEmailNote = ({ email, isActive }: Props) => {
    const [isHidden, setIsHidden] = useState(false);

    const text = useMemo(() => {
        if (isActive) {
            if (email) {
                const formattedEmail = <MiddleEllipsis text={email}></MiddleEllipsis>;
                return c('Bitcoin via Email')
                    .jt`Bitcoin via Email is active! ${WALLET_APP_NAME} users can send bitcoin to ${formattedEmail}`;
            }

            return c('Bitcoin via Email').t`Bitcoin via Email is active! Discover how it works`;
        }

        return c('Bitcoin via Email')
            .t`Bitcoin via Email is not active. Enable it so ${WALLET_APP_NAME} users can easily send you bitcoin.`;
    }, [email, isActive]);

    if (isHidden) {
        return null;
    }

    return (
        <div className="flex flex-row flex-nowrap p-4 rounded-lg items-center color-norm my-3 bg-weak relative">
            <div className="shrink-0">
                <img src={isActive ? bitcoinEmailActive : bitcoinEmailInactive} alt="" />
            </div>
            <div className="flex flex-column mx-4">
                <p className="my-0 pt-2 pr-1 w-full">{text}</p>
                <div>
                    <CoreButtonLike shape="underline" color="norm" as={Href} href="kb-post">{c('Bitcoin via Email')
                        .t`Learn more`}</CoreButtonLike>
                </div>
            </div>
            <div className="absolute top-0 right-0 shrink-0">
                <CoreButton
                    icon
                    shape="ghost"
                    onClick={() => {
                        setIsHidden(true);
                    }}
                >
                    <Icon name="cross" size={5} />
                </CoreButton>
            </div>
        </div>
    );
};
