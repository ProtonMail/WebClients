import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { IcArrowRight } from '@proton/icons/icons/IcArrowRight';
import { SSO_PATHS } from '@proton/shared/lib/constants';

import { SupportedActions } from '../../helper';
import expiredLink from './expiredLink.svg';

interface Props {
    action: SupportedActions | null;
}
const ExpiredLink = ({ action }: Props) => {
    return (
        <div className="h-full flex flex-column justify-center items-center bg-norm text-center">
            <img src={expiredLink} alt="" />
            <h1 className="text-bold text-2xl mb-2 mt-8">{c('Info').t`Link expired`}</h1>
            {action === SupportedActions.SignOut && (
                <>
                    <p className="max-w-custom m-0" style={{ '--max-w-custom': '30rem' }}>
                        {c('Description')
                            .t`The link to sign out on all your devices has expired. Try signing in again to receive a new one.`}
                    </p>
                    <ButtonLike
                        className="mt-8 flex items-center gap-2"
                        as={Href}
                        href={SSO_PATHS.LOGIN}
                        target={'_self'}
                    >
                        {c('Action').t`Sign in`} <IcArrowRight />
                    </ButtonLike>
                </>
            )}
        </div>
    );
};

export default ExpiredLink;
