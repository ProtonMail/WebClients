import { useState } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { Icon, Spotlight } from '@proton/components/components';
import { useActiveBreakpoint } from '@proton/components/hooks';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { isProtonDocument } from '@proton/shared/lib/helpers/mimetype';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

import { useDownloadScanFlag } from '../../../store';
import { useSelection } from '../../FileBrowser';
import { getSelectedItems } from '../../sections/helpers';
import { DownloadButton, DownloadButtonProps } from './DownloadButton';

interface Props extends DownloadButtonProps {
    children: React.ReactNode;
    className?: string;
}

const SpotlightContent = () => (
    <div>
        <h5 className="text-semibold mb-3 flex items-center">
            <Icon name="info-circle" size={5} className="mr-2" />
            {c('Info').t`File scanning in Drive`}
        </h5>
        <div className="mb-6">
            {c('Info')
                .t`To help protect you, ${DRIVE_APP_NAME} can scan and block malicious files. You should still only download files from people you trust.`}{' '}
            <Href className="text-no-decoration" href={getKnowledgeBaseUrl('/proton-drive-malware-protection')}>
                {c('Link').t`Learn more`}
            </Href>
        </div>
    </div>
);

const SpotlightFooter = () => (
    <div>
        <div className="flex flex-row items-center">
            <Icon name="lock-check-filled" size={6} className="mr-2 color-disabled" />
            <span className="color-disabled">{c('Info').t`End-to-End Encrypted`}.</span>
            <Href className="color-disabled ml-1" href={getKnowledgeBaseUrl('/proton-drive-malware-protection')}>
                {c('Link').t`Learn more`}
            </Href>
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
            footer={<SpotlightFooter />}
            show={show}
            onClose={handleClose}
            originalPlacement="bottom-end"
            size="large"
        >
            <Icon name="info-circle" size={4} data-testid="scan-and-download-tooltip" onClick={toggleSpotlight} />
        </Spotlight>
    );
};

export default function SharedPageHeader({ children, rootItem, items, className }: Props) {
    const isDownloadScanEnabled = useDownloadScanFlag();
    const { viewportWidth } = useActiveBreakpoint();
    const selectionControls = useSelection();

    const selectedItems = getSelectedItems(items || [], selectionControls?.selectedItemIds || []);

    const hasOnlyDocuments =
        (items.length > 0 && items.every((item) => item.isFile && isProtonDocument(item.mimeType))) ||
        (selectedItems.length > 0 && selectedItems.every((item) => item.isFile && isProtonDocument(item.mimeType)));

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
                                hideIcon
                                disabled={hasOnlyDocuments}
                            />
                        </>
                    ) : null}
                    <DownloadButton
                        rootItem={rootItem}
                        items={items}
                        hideIcon={isDownloadScanEnabled}
                        disabled={hasOnlyDocuments}
                    />
                </>
            )}
        </div>
    );
}
