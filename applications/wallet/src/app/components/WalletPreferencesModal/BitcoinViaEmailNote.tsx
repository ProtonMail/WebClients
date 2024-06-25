import { useState } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import { Icon } from '@proton/components/components';
import walletSendingSimplePlane from '@proton/styles/assets/img/illustrations/wallet-sending-simple-plane.svg';
import clsx from '@proton/utils/clsx';

import { CoreButton, CoreButtonLike } from '../../atoms';

interface Props {
    isActive: boolean;
}

export const BitcoinViaEmailNote = ({ isActive }: Props) => {
    const [isHidden, setIsHidden] = useState(false);

    if (isHidden) {
        return null;
    }

    return (
        <div
            className={clsx(
                'flex flex-row flex-nowrap p-4 rounded-lg items-center color-norm my-3',
                isActive ? 'bg-success' : 'bg-danger'
            )}
        >
            <div>
                <img src={walletSendingSimplePlane} alt="" />
            </div>
            <div className="flex flex-column mx-4">
                <p className="my-0">
                    {isActive
                        ? c('Bitcoin via Email').t`Bitcoin via Email is active! Discover how it works`
                        : c('Bitcoin via Email')
                              .t`Bitcoin via Email is not active. Enable it so others can easily send you bitcoin.`}
                </p>
                <div>
                    <CoreButtonLike shape="underline" as={Href} href="kb-post">{c('Bitcoin via Email')
                        .t`Learn more`}</CoreButtonLike>
                </div>
            </div>
            <div className="ml-auto">
                <CoreButton
                    icon
                    shape="ghost"
                    onClick={() => {
                        setIsHidden(true);
                    }}
                >
                    <Icon name="cross" size={6} />
                </CoreButton>
            </div>
        </div>
    );
};
