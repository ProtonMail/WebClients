import { ModalTwo } from '@proton/components/index';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import brand from '@proton/styles/assets/img/meet/brand-dual-colors.svg';

import { CloseButton } from '../../atoms/CloseButton/CloseButton';

import './TranslucentModal.scss';

export const TranslucentModal = ({
    open,
    onClose,
    children,
}: {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
}) => (
    <ModalTwo open={open} onClose={onClose} rootClassName="translucent-modal" size="full" fullscreen>
        <div className="w-full meet-container-padding-x overflow-y-auto h-full">
            <div className="flex justify-space-between items-center pt-5 pb-5">
                <img src={brand} alt={MEET_APP_NAME} className="h-custom" style={{ '--h-custom': '2.5rem' }} />
                <CloseButton onClose={onClose} />
            </div>
            <div className="translucent-modal_container flex">
                <div className="m-auto pt-10 pb-10">{children}</div>
            </div>
        </div>
    </ModalTwo>
);
