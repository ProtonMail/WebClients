import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import type { ModalProps } from '@proton/components/index';
import { SettingsLink } from '@proton/components/index';
import Prompt from '@proton/components/components/prompt/Prompt';
import lumoCatAlert from '@proton/styles/assets/img/lumo/lumo-cat-alert.svg';

import { SignInLink } from '../Links/SignInLink';

interface Props {
    onClick?: () => void;
}

export const GuestChatDisclaimerModal = ({ onClick, ...modalProps }: Props & ModalProps) => {
    const history = useHistory();

    const handleClick = () => {
        history.replace('/');
        onClick?.();
    };
    const linkSignup = <SignInLink key="eslint-autofix-4008E8" />;
    const footnote = c('collider_2025: Link').jt`Already have an account? ${linkSignup}`;

    return (
        <Prompt
            {...modalProps}
            buttons={[
                <ButtonLike as={SettingsLink} className="w-full" shape="solid" color="norm" path="/signup">{c(
                    'collider_2025: Upsell'
                ).t`Create free account`}</ButtonLike>,
                <Button onClick={handleClick} className="w-full" shape="solid" color="weak">{c('collider_2025: Action')
                    .t`Continue`}</Button>,
            ]}
            footnote={footnote}
        >
            <div className="flex flex-column gap-2">
                <div className="flex items-center flex-column gap-4">
                    <img
                        className="h-custom w-custom"
                        src={lumoCatAlert}
                        alt=""
                        style={{ '--w-custom': '5.25rem', '--h-custom': '5.625rem' }}
                    />
                    {/* translator: Don't lose the thread */}
                    <h1 className="block h3 mt-2 text-semibold text-center text-break">{c('collider_2025: Title')
                        .t`Don't lose the thread`}</h1>
                </div>

                {/* translator: Save all your conversations in a chat history only you can see. Sign in or create an account.   */}
                <p className="color-weak text-center m-0">{c('collider_2025: Info')
                    .t`Save all your conversations in a chat history only you can see. Sign in or create an account.`}</p>
            </div>
        </Prompt>
    );
};
