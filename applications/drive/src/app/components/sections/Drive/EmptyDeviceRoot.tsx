import { c } from 'ttag';

import { EmptyViewContainer } from '@proton/components';
import uploadSvg from '@proton/styles/assets/img/illustrations/empty-device-root.svg';

const EmptyDeviceRoot = () => {
    return (
        <div role="presentation" onClick={close} className="flex w100 flex flex-item-fluid">
            <EmptyViewContainer
                imageProps={{ src: uploadSvg, title: c('Info').t`No synced folders` }}
                data-test-id="my-files-device-root-empty-placeholder"
            >
                <h3 className="text-bold">{c('Info').t`No synced folders`}</h3>
                <p className="color-weak">{c('Info').t`Folders you sync from your computer will appear here.`}</p>
            </EmptyViewContainer>
        </div>
    );
};

export default EmptyDeviceRoot;
