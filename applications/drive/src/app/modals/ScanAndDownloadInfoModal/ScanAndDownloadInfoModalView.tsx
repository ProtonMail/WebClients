import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import type { ModalProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

export function ScanAndDownloadInfoModalView({ open, onClose, onExit }: ModalProps = {}) {
    return (
        <ModalTwo open={open} onExit={onExit} onClose={onClose} size="small">
            <ModalTwoHeader title={c('Title').t`Check for malicious files`} />
            <ModalTwoContent>
                <p>
                    {c('Info')
                        .t`To help protect you, ${DRIVE_APP_NAME} can scan your files in a privacy-preserving manner and block malicious files. However, it's still best to download files only from trusted sources. `}
                    <Href href={getKnowledgeBaseUrl('/proton-drive-malware-protection')}>{c('Action')
                        .t`Learn more.`}</Href>
                </p>
            </ModalTwoContent>
            <ModalTwoFooter className="flex justify-end items-center">
                <Button color="norm" onClick={onClose}>{c('Action').t`Got it`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
}
