import { useState } from 'react';

import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import { Icon, Spotlight } from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

const SpotlightContent = () => (
    <div>
        <h5 className="text-semibold flex items-center">
            <Icon name="info-circle" size={5} className="mr-2" />
            {c('Info').t`Check for malicious files`}
        </h5>
        <p>
            {c('Info')
                .t`To help protect you, ${DRIVE_APP_NAME} can scan your files in a privacy-preserving manner and block malicious files. However, it’s still best to download files only from trusted sources.`}{' '}
            <Href className="text-no-decoration" href={getKnowledgeBaseUrl('/proton-drive-malware-protection')}>
                {c('Link').t`Learn more`}
            </Href>
        </p>
    </div>
);

export const ScanAndDownloadSpotlightButton = ({ className }: { className?: string }) => {
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
            <Button
                icon
                shape="ghost"
                className={className}
                onClick={toggleSpotlight}
                aria-label={c('Action').t`Open scan and download info`}
            >
                <Icon name="info-circle" size={4} data-testid="scan-and-download-tooltip" />
            </Button>
        </Spotlight>
    );
};
