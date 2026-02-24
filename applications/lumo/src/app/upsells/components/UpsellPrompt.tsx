import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Icon, SettingsLink } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import lumoFavoritesTeaser from '@proton/styles/assets/img/lumo/lumo-favorites-teaser.svg';

import './UpsellPrompt.scss';
import {SignInLink} from "../../components/Links/SignInLink";
import type {ActivePanel} from "../../layouts/MainLayout";

interface Props {
    position: { top: number; left: number };
    onClose: () => void;
    type: ActivePanel;
}

const getUpsellPromptText = (type: ActivePanel) => {
    return {
        header:
            type === 'chatHistory'
                ? c('collider_2025: Title').t`Unlock chat history`
                : c('collider_2025: Title').t`Unlock starring and organize your chats`,
        subline:
            type === 'chatHistory'
                ? c('collider_2025: Subline').t`Create a ${BRAND_NAME} Account to unlock chat history`
                : c('collider_2025: Info').t`Create a ${BRAND_NAME} Account to unlock 1 Week of chat history`,
    };
};
export const UpsellPrompt = ({ position, onClose, type }: Props) => {
    const { header, subline } = getUpsellPromptText(type);
    const ref = useRef<HTMLDivElement>(null);

    const handleClickOutside = (event: MouseEvent) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
            onClose();
        }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose();
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const linkSignup = <SignInLink key="eslint-autofix-217F23" />;

    return (
        <div
            ref={ref}
            className="lumoprompt flex flex-column flex-nowrap border items-center text-center absolute rounded-2xl p-4 gap-2 z-50 shadow-lifted bg-weak"
            style={{ top: position.top, left: position.left }}
        >
            <Button icon shape="ghost" className="self-end" onClick={onClose}>
                <Icon name="cross"></Icon>
            </Button>
            <div className="w-custom h-custom shrink-0" style={{ '--w-custom': '350px', '--h-custom': '280px' }}>
                <img
                    src={lumoFavoritesTeaser}
                    alt=""
                    className="w-full h-full"
                    // style={{ '--w-custom': '15rem', '--h-custom': '10.438rem' }}
                />
            </div>
            <div className="flex flex-column flex-nowrap gap-2 px-4">
                <h1 className="my-4 text-semibold text-2xl text-left">{header}</h1>
                <p className="mt-0 text-left color-hint">{subline}</p>
                <ButtonLike as={SettingsLink} className="mt-4" shape="solid" color="norm" path="/signup">{c(
                    'collider_2025: Upsell'
                ).t`Create a free account`}</ButtonLike>
                <p className="m-0">{c('collider_2025: Link').jt`Already have an account? ${linkSignup}`}</p>
            </div>
        </div>
    );
};
