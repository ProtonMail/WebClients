import { c } from 'ttag';

import lumoImageLight from '@proton/styles/assets/img/lumo/lumo-image-light.svg';

import { GuestSignInState } from '../../components/Guest/GuestSignInState/GuestSignInState';

/** Guest upsell for the Library (Creations and Images tabs share the same state). */
export const LibraryGuestSignInState = () => {
    return (
        <GuestSignInState
            image={lumoImageLight}
            imageAlt=""
            title={c('collider_2025:Title').t`Sign in to build your library`}
            description={c('collider_2025:Info')
                .t`Create documents, images, and more in your chats. Sign in or create a free account to save your creations.`}
        />
    );
};
