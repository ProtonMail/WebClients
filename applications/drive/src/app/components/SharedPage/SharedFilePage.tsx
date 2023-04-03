import { c } from 'ttag';

import { FilePreviewContent } from '@proton/components/containers/filePreview/FilePreview';

import { DecryptedLink } from '../../store';
import { usePublicFileView } from '../../store/_views/useFileView';
import { FileBrowserStateProvider } from '../FileBrowser';
import { useUpsellFloatingModal } from '../modals/UpsellFloatingModal';
import Breadcrumbs from './Layout/Breadcrumbs';
import { HeaderSubtitle } from './Layout/HeaderSubtitle';
import SharedPageFooter from './Layout/SharedPageFooter';
import SharedPageHeader from './Layout/SharedPageHeader';
import SharedPageLayout from './Layout/SharedPageLayout';

interface Props {
    token: string;
    link: DecryptedLink;
}

export default function SharedFilePage({ token, link }: Props) {
    const { isLinkLoading, isContentLoading, error, contents } = usePublicFileView(token, link.linkId);
    const [renderUpsellFloatingModal] = useUpsellFloatingModal();

    return (
        <FileBrowserStateProvider itemIds={[link.linkId]}>
            <SharedPageLayout
                FooterComponent={<SharedPageFooter rootItem={link} items={[{ id: link.linkId, ...link }]} />}
            >
                <SharedPageHeader rootItem={link} items={[{ id: link.linkId, ...link }]}>
                    <div className="max-w100">
                        <Breadcrumbs
                            token={token}
                            name={link.name}
                            linkId={link.linkId}
                            className="shared-folder-header-breadcrumbs pb0-25"
                        />
                        <HeaderSubtitle size={link.size} />
                    </div>
                </SharedPageHeader>
                <FilePreviewContent
                    isMetaLoading={isLinkLoading}
                    isLoading={isContentLoading}
                    error={error ? error.message || error.toString?.() || c('Info').t`Unknown error` : undefined}
                    contents={contents}
                    fileName={link?.name}
                    mimeType={link?.mimeType}
                    fileSize={link?.size}
                    imgThumbnailUrl={link?.cachedThumbnailUrl}
                    previewParams={{ img: { zoomControls: false } }}
                />
            </SharedPageLayout>
            {renderUpsellFloatingModal}
        </FileBrowserStateProvider>
    );
}
