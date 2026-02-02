import { c } from 'ttag';

import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    type ModalStateProps,
    ModalTwoContent,
} from '@proton/components';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { getNumAccessesTooltipMessage, getSizeTooltipMessage } from '@proton/shared/lib/drive/translations';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { BaseDetailsModal } from './BaseDetailsModal';
import { FileNameRow, SizeRow, TextRow, TimeRow } from './DetailsRows';
import type { FileDetails } from './useFileDetailsModalState';

import './FileDetailsModalView.scss';

export type FileDetailsModalViewProps = ModalStateProps & {
    isLoading: boolean;
    title: string;
    hasError: boolean;
    details?: FileDetails;
};

export function FileDetailsModalView(modalProps: FileDetailsModalViewProps) {
    return <BaseDetailsModal<FileDetails> {...modalProps} DetailsComponent={FileDetailsComponent} />;
}

function FileDetailsComponent({ details }: { details: FileDetails }) {
    return (
        <ModalTwoContent>
            {details.hasDecryptionError ? (
                <Banner noIcon variant={BannerVariants.DANGER} data-testid="drive:signature-alert" className="mb-4">
                    {c('Info').t`Unfortunately, it appears that the file or some of its data cannot be decrypted.`}
                </Banner>
            ) : (
                // TODO: We need to find a better way of handling skipping of signature check (In anonymous context)
                // Probably showing a warning message would be the proper solution
                details.authorshipStatus !== null && (
                    <Banner
                        noIcon
                        variant={details.authorshipStatus.ok ? BannerVariants.SUCCESS : BannerVariants.DANGER}
                        data-testid="drive:signature-alert"
                        className="flex mb-4 banner-signature-alert"
                    >
                        {details.authorshipStatus.details.length === 0 ? (
                            <span dangerouslySetInnerHTML={{ __html: details.authorshipStatus.message }} />
                        ) : (
                            <Collapsible>
                                <CollapsibleHeader
                                    suffix={
                                        <CollapsibleHeaderIconButton>
                                            <IcChevronDown />
                                        </CollapsibleHeaderIconButton>
                                    }
                                >
                                    <span dangerouslySetInnerHTML={{ __html: details.authorshipStatus.message }} />
                                </CollapsibleHeader>
                                <CollapsibleContent>
                                    <ul>
                                        {details.authorshipStatus.details.map((detail) => (
                                            <li key={detail}>{detail}</li>
                                        ))}
                                    </ul>
                                    <a href={getKnowledgeBaseUrl('/drive-signature-management')} target="_blank">
                                        {c('Action').t`Learn more`}
                                    </a>
                                </CollapsibleContent>
                            </Collapsible>
                        )}
                    </Banner>
                )
            )}
            <FileNameRow label={c('Title').t`Name`} name={details.name} />
            <FileNameRow label={c('Title').t`Location`} name={details.location} />
            <TextRow label={c('Title').t`Created by`} text={details.createdBy} />
            {details.lastUploadedBy && details.lastUploadedBy !== details.createdBy && (
                <TextRow
                    label={c('Title').t`Last uploaded by`}
                    text={details.lastUploadedBy}
                    dataTestId="drive:last-edited-by"
                />
            )}
            <TimeRow label={c('Title').t`Uploaded`} time={details.uploadedTime} />
            {details.claimedModifiedTime && (
                <TimeRow label={c('Title').t`Modified`} time={details.claimedModifiedTime} />
            )}
            {details.file && (
                <>
                    {details.file.descriptiveMediaType && (
                        <TextRow label={c('Title').t`Type`} text={details.file.descriptiveMediaType} />
                    )}
                    {details.file.mediaType && (
                        <TextRow label={c('Title').t`Media type`} text={details.file.mediaType} />
                    )}
                    {details.file.storageSize !== undefined && (
                        <SizeRow
                            label={
                                <>
                                    {c('Title').t`Size`}
                                    <Tooltip title={getSizeTooltipMessage()} className="ml-1 mb-1">
                                        <IcInfoCircle size={3.5} alt={getSizeTooltipMessage()} />
                                    </Tooltip>
                                </>
                            }
                            size={details.file.storageSize}
                            dataTestId="file-size"
                        />
                    )}
                    {details.file.claimedSize !== undefined && (
                        <SizeRow label={c('Title').t`Original size`} size={details.file.claimedSize} />
                    )}
                </>
            )}
            {details.isShared !== undefined && (
                <TextRow
                    label={c('Title').t`Shared`}
                    text={details.isShared ? c('Info').t`Yes` : c('Info').t`No`}
                    dataTestId="drive:is-shared"
                />
            )}
            {details.numberOfDownloads !== undefined && (
                <TextRow
                    label={
                        <>
                            {c('Title').t`Number of downloads`}
                            <Tooltip title={getNumAccessesTooltipMessage()} className="ml-1 mb-1">
                                <IcInfoCircle size={3.5} alt={getNumAccessesTooltipMessage()} />
                            </Tooltip>
                        </>
                    }
                    text={details.numberOfDownloads}
                />
            )}

            <hr />

            <Collapsible>
                <CollapsibleHeader
                    suffix={
                        <CollapsibleHeaderIconButton>
                            <IcChevronDown />
                        </CollapsibleHeaderIconButton>
                    }
                    data-testid="drive:advanced-details"
                >
                    {c('Title').t`Advanced details`}
                </CollapsibleHeader>
                <CollapsibleContent>
                    {details.file && (
                        <>
                            <TextRow label={c('Title').t`Size in bytes`} text={details.file.storageSize} />
                            <TextRow label={c('Title').t`Original size in bytes`} text={details.file.claimedSize} />
                            <TextRow
                                label={c('Title').t`SHA1`}
                                text={<div className="text-break">{details.file.claimedSha1}</div>}
                                dataTestId="drive:file-digest"
                            />
                        </>
                    )}
                    <TextRow label={c('Title').t`UID`} text={<div className="text-break">{details.uid}</div>} />
                    <TextRow
                        label={c('Title').t`Download details`}
                        text={
                            <>
                                <DownloadJsonButton json={details.fullEntityInJson} label={c('Action').t`Full data`} />
                                &nbsp;
                                <DownloadJsonButton
                                    json={details.safeEntityInJson}
                                    label={c('Action').t`No sensitive data`}
                                />
                            </>
                        }
                    />
                </CollapsibleContent>
            </Collapsible>
        </ModalTwoContent>
    );
}

function DownloadJsonButton({ json, label }: { json: string; label: string }) {
    return (
        <Button
            onClick={() => {
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
            }}
        >
            {label}
        </Button>
    );
}
