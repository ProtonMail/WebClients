import { Icon } from '@proton/components';

import { useDownloadAppModal } from '../../../modals/DownloadAppModal/useDownloadAppModal';

export function DownloadAppButton() {
    const [modal, showModal] = useDownloadAppModal();

    return (
        <>
            <button className="drawer-sidebar-button rounded interactive" onClick={() => showModal({})}>
                <Icon name="devices" size={5} />
            </button>
            {modal}
        </>
    );
}
