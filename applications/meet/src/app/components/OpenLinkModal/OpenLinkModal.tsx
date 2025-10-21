import { c } from 'ttag';

import { Button } from '@proton/atoms';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import linkImg from '@proton/styles/assets/img/meet/link.png';

import './OpenLinkModal.scss';

interface OpenLinkModalProps {
    link: string;
    onClose: () => void;
}

export const OpenLinkModal = ({ link, onClose }: OpenLinkModalProps) => {
    const handleClick = () => {
        const otherWindow = window.open();
        if (otherWindow) {
            otherWindow.location.href = link;
        }
    };

    return (
        <ModalTwo open={true} rootClassName="bg-transparent open-link-modal" className="meet-radius border border-norm">
            <div
                className="flex flex-column justify-end items-center gap-4 text-center bg-norm h-full p-6 pt-custom overflow-hidden"
                style={{ '--pt-custom': '5rem' }}
            >
                <img
                    className="w-custom h-custom mb-2"
                    src={linkImg}
                    alt=""
                    style={{ '--w-custom': '7.5rem', '--h-custom': '7.5rem' }}
                />

                <div className="text-3xl text-semibold">{c('Info').t`Open external link`}</div>
                <div className="color-weak">{c('Info')
                    .t`You’re about to open a link in a new tab. Make sure you trust the website before continuing.`}</div>

                <div className="color-primary link-to-open">{link}</div>

                <div className="w-full flex flex-column gap-2 mt-4">
                    <Button
                        className="rounded-full color-invert reload-button py-4 text-semibold"
                        onClick={handleClick}
                        color="norm"
                        size="large"
                    >{c('Action').t`Open link`}</Button>

                    <Button
                        className="rounded-full py-4 bg-weak close-button border-none text-semibold"
                        onClick={onClose}
                        color="weak"
                        size="large"
                    >
                        {c('Action').t`Cancel`}
                    </Button>
                </div>
            </div>
        </ModalTwo>
    );
};
