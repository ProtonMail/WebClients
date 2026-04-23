import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { Icon } from '@proton/components/index';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import tvLogo from '../assets/tv.svg';

interface Props {
    onConfirm: () => void;
}

export const TvConfirmForkSession = ({ onConfirm }: Props) => {
    return (
        <div className="flex flex-column items-center gap-6">
            <img src={tvLogo} alt="tv image" role="presentation" />
            <div className="flex flex-column items-center gap-2">
                <h3 className="text-bold">{c('Title').t`Sign in on TV?`}</h3>
                <span className="color-weak">
                    {c('Info').t`This will allow the TV to access your ${BRAND_NAME} account.`}
                </span>
            </div>
            <div className="flex flex-row items-center w-full justify-center gap-5">
                <Icon className="color-weak" name="info-circle-filled" />
                <span className="color-weak">{c('Info').t`Only sign in on devices you trust`}</span>
            </div>
            <div className="flex flex-column w-full gap-4 items-center">
                <Button onClick={onConfirm} fullWidth color="norm" shape="solid">{c('Button').t`Sign in`}</Button>
                <Href className="w-full" href="https://account.protonvpn.com">
                    <Button fullWidth>{c('Button').t`Cancel`}</Button>
                </Href>
            </div>
        </div>
    );
};
