import { c } from 'ttag';

import { EmptyViewContainer } from '@proton/components';
import noContentSvg from '@proton/styles/assets/img/illustrations/empty-devices.svg';

import './EmptyDevices.scss';

const EmptyDevices = () => {
    const LearnMore = (
        <a href={''} target="_blank" key="learn-more-link">
            {c('Action').t`Learn more`}
        </a>
    );

    return (
        <EmptyViewContainer imageProps={{ src: noContentSvg, title: c('Info').t`No synced computers` }}>
            <h3 className="text-bold">{c('Info').t`No synced computers`}</h3>
            <p className="empty-devices-placeholder-info">
                {c('Info')
                    .jt`Use Drive for Desktop to sync folders on your computer with Proton Drive. They’ll show up here and be accessible from anywhere.  ${LearnMore}`}
            </p>
        </EmptyViewContainer>
    );
};

export default EmptyDevices;
