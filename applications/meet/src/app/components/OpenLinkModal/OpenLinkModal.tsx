import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import { openNewTab } from '@proton/shared/lib/helpers/browser';
import linkImg from '@proton/styles/assets/img/meet/link.png';

import './OpenLinkModal.scss';

interface OpenLinkModalProps {
    link: string;
    onClose: () => void;
}

export const OpenLinkModal = ({ link, onClose }: OpenLinkModalProps) => {
    const handleClick = () => {
        onClose();
        openNewTab(link);
    };

    return (
        <ModalTwo
            open={true}
            rootClassName="bg-transparent open-link-modal"
            className="open-link-modal-body meet-radius border border-norm"
        >
            <div
                className="flex flex-column flex-nowrap justify-end items-center gap-4 text-center bg-norm h-full p-6 pt-custom overflow-y-auto"
                style={{ '--pt-custom': '5rem' }}
            >
                <img
                    className="w-custom h-custom mb-2 shrink-0"
                    src={linkImg}
                    alt=""
                    style={{ '--w-custom': '7.5rem', '--h-custom': '7.5rem' }}
                />

                <div className="text-3xl text-semibold shrink-0">{c('Info').t`Open external link`}</div>
                <div className="color-weak shrink-0">{c('Info')
                    .t`You’re about to open a link in a new tab. Make sure you trust the website before continuing.`}</div>

                <div
                    className="color-primary link-to-open overflow-auto h-fit-content max-h-custom shrink-0"
                    style={{ '--max-h-custom': '4rem' }}
                >
                    {link}
                </div>

                <div className="w-full flex flex-column gap-2 mt-4 shrink-0">
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
