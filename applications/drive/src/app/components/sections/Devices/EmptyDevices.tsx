import { c } from 'ttag';

import { EmptyViewContainer } from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import noContentSvg from '@proton/styles/assets/img/illustrations/empty-devices.svg';

import './EmptyDevices.scss';

const EmptyDevices = () => {
    const LearnMore = (
        <p className="p0 m0">
            <a href={'https://drive.proton.me/urls/3SF8FZV8B0#grWxkmu9q4NP'} target="_blank" key="learn-more-link">
                {c('Action').t`Download the Windows application`}
            </a>
        </p>
    );

    return (
        <EmptyViewContainer imageProps={{ src: noContentSvg, title: c('Info').t`No synced computers` }}>
            <h3 className="text-bold">{c('Info').t`No synced computers`}</h3>
            <p className="empty-devices-placeholder-info">
                {c('Info')
                    .jt`Use Drive for Desktop to sync folders on your computer with ${DRIVE_APP_NAME}. They’ll show up here and be accessible from anywhere. ${LearnMore}`}
            </p>
        </EmptyViewContainer>
    );
};

export default EmptyDevices;
