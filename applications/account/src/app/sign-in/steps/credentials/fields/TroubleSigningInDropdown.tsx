import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { IcArrowOutSquare } from '@proton/icons/icons/IcArrowOutSquare';
import { IcKey } from '@proton/icons/icons/IcKey';
import { IcLifeRing } from '@proton/icons/icons/IcLifeRing';
import { IcQrCode } from '@proton/icons/icons/IcQrCode';
import { IcUserCircle } from '@proton/icons/icons/IcUserCircle';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { useFlag } from '@proton/unleash/useFlag';

import type { Paths } from '../../../../content/helper';
import SupportDropdown from '../../../../public/SupportDropdown';
import { openTroubleshootWithLumo } from '../../../../public/TroubleshootWithLumo';

const dropdownItemClassName =
    'dropdown-item-link w-full px-4 py-2 flex flex-nowrap gap-2 items-center text-no-decoration text-left';

export const TroubleSigningInDropdown = ({
    paths,
    resetPath,
    forgotUsernamePath,
}: {
    paths: Paths;
    resetPath: string;
    forgotUsernamePath: string;
}) => {
    const lumoSignInHelperEnabled = useFlag('LumoSignInHelp');
    return (
        <>
            <hr className="my-4" />
            <div className="text-center">
                <SupportDropdown buttonClassName="mx-auto link link-focus" content={c('Link').t`Trouble signing in?`}>
                    <Link to={resetPath} className={dropdownItemClassName}>
                        <IcKey />
                        {c('Link').t`Forgot password?`}
                    </Link>
                    <Link to={forgotUsernamePath} className={dropdownItemClassName}>
                        <IcUserCircle />
                        {c('Link').t`Forgot username?`}
                    </Link>
                    {
                        /* VPN unsupported, check path */
                        paths.signinAnotherDevice && (
                            <Link to={paths.signinAnotherDevice} className={dropdownItemClassName}>
                                <IcQrCode />
                                {c('edm').t`Sign in with QR code`}
                            </Link>
                        )
                    }
                    {lumoSignInHelperEnabled && (
                        <button
                            type="button"
                            onClick={() => openTroubleshootWithLumo()}
                            className={dropdownItemClassName}
                        >
                            <IcLifeRing />
                            {c('Link').t`Get help from ${LUMO_SHORT_APP_NAME}`}
                        </button>
                    )}
                    <hr className="m-0" />
                    <Href href={getKnowledgeBaseUrl('/common-login-problems')} className={dropdownItemClassName}>
                        {c('Link').t`Frequent sign-in problems`}
                        <IcArrowOutSquare className="color-weak ml-auto" />
                    </Href>
                </SupportDropdown>
            </div>
        </>
    );
};
