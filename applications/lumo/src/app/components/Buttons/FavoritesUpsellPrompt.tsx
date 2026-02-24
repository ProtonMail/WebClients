import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import type { ModalProps } from '@proton/components/index';
import { SettingsLink } from '@proton/components/index';
import Prompt from '@proton/components/components/prompt/Prompt';
import lumoCatFavorite from '@proton/styles/assets/img/lumo/lumo-cat-favorite.svg';

import { SignInLinkButton } from '../Links/SignInLink';

const FavoritesUpsellPrompt = ({ ...modalProps }: ModalProps) => {
    // const footnote = c('collider_2025: Link').jt`Already have an account? ${(<SignInLink />)}`;

    return (
        <Prompt
            {...modalProps}
            buttons={[
                <ButtonLike as={SettingsLink} className="w-full" shape="solid" color="norm" path="/signup">{c(
                    'collider_2025: Upsell'
                ).t`Create free account`}</ButtonLike>,
                <SignInLinkButton className="w-full" color="weak" shape="outline" />,
            ]}
        >
            <div className="flex flex-column gap-2">
                <div className="flex items-center flex-column">
                    <img
                        className="h-custom w-custom"
                        src={lumoCatFavorite}
                        alt=""
                        style={{ '--w-custom': '5.25rem', '--h-custom': '5.625rem' }}
                    />
                    {/* translator: Save your favorites */}
                    <h1 className="block h3 mt-2 text-semibold text-center text-break">{c('collider_2025: Title')
                        .t`Save your favorites`}</h1>
                </div>

                {/* translator: To refer back to this conversation later, sign in or create an account. */}
                <p className="color-weak text-center m-0">{c('collider_2025: Info')
                    .t`To refer back to this conversation later, sign in or create an account.`}</p>
            </div>
        </Prompt>
    );
};

export default FavoritesUpsellPrompt;
