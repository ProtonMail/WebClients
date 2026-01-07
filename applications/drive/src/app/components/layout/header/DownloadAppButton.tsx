import { c } from 'ttag';

import { IcDevices } from '@proton/icons/icons/IcDevices';

import { useDownloadAppModal } from '../../../modals/DownloadAppModal/useDownloadAppModal';

export function DownloadAppButton() {
    const [modal, showModal] = useDownloadAppModal();

    return (
        <>
            <button
                className="drawer-sidebar-button rounded interactive"
                onClick={() => showModal({})}
                title={c('Action').t`Get mobile and desktop apps`}
            >
                <IcDevices size={5} alt={c('Action').t`Get mobile and desktop apps`} />
            </button>
            {modal}
        </>
    );
}
