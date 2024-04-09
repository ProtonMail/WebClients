import { useState } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { Icon, Spotlight } from '@proton/components/components';
import { useActiveBreakpoint } from '@proton/components/hooks';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { getBlogURL } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

import { useDownloadScanFlag } from '../../../store';
import { DownloadButton, DownloadButtonProps } from './DownloadButton';

interface Props extends DownloadButtonProps {
    children: React.ReactNode;
    className?: string;
}

const SpotlightContent = () => (
    <div>
        <h5 className="text-semibold mb-2">{c('Info').t`File scanning in Drive`}</h5>
        <div className="mb-6">
            {c('Info')
                .t`To help protect you, ${DRIVE_APP_NAME} can scan and block malicious files. You should still only download files from people you trust.`}{' '}
            <Href className="color-weak" href={getBlogURL('/proton-drive-malware-protection')}>
                {c('Link').t`Learn more`}
            </Href>
        </div>
        <div className="flex flex-row items-center">
            <Icon name="shield-2-check-filled" size={6} className="mr-1 color-success" />
            <span>{c('Info').t`End-to-End Encrypted`}</span>
        </div>
    </div>
);

const InfoIcon = () => {
    const [show, setShow] = useState(false);
    const toggleSpotlight = () => setShow((current) => !current);
    const handleClose = () => setShow(false);

    return (
        <Spotlight
            content={<SpotlightContent />}
            show={show}
            onClose={handleClose}
            originalPlacement="bottom-end"
            size="large"
        >
            <Icon
                name="exclamation-circle"
                size={4}
                data-testid="scan-and-download-tooltip"
                onClick={toggleSpotlight}
            />
        </Spotlight>
    );
};

export default function SharedPageHeader({ children, rootItem, items, className }: Props) {
    const isDownloadScanEnabled = useDownloadScanFlag();
    const { viewportWidth } = useActiveBreakpoint();

    return (
        <div className={clsx('flex flex-nowrap shrink-0 justify-space-between items-center', className)}>
            <div className="flex flex-nowrap flex-1 items-center mb-0 pb-0 mr-4 shared-page-layout-header">
                {children}
            </div>
            {viewportWidth['<=small'] || items.length === 0 ? null : (
                <>
                    {isDownloadScanEnabled ? (
                        <>
                            <InfoIcon />
                            <DownloadButton
                                rootItem={rootItem}
                                items={items}
                                isScanAndDownload
                                className="mx-4"
                                color="weak"
                            />
                        </>
                    ) : null}
                    <DownloadButton rootItem={rootItem} items={items} hideIcon={isDownloadScanEnabled} />
                </>
            )}
        </div>
    );
}
