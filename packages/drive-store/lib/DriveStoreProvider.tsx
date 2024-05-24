import { DevicesProvider } from '../store/_devices';
import { DownloadsProvider } from '../store/_downloads';
import { DriveEventManagerProvider } from '../store/_events';
import { LinksProvider } from '../store/_links';
import { SharesProvider } from '../store/_shares';
import { UploadProvider } from '../store/_uploads';
import { VolumesProvider } from '../store/_volumes';

export const DriveStoreProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <DriveEventManagerProvider>
            <VolumesProvider>
                <SharesProvider>
                    <LinksProvider>
                        <DevicesProvider>
                            <DownloadsProvider>
                                <UploadProvider>{children}</UploadProvider>
                            </DownloadsProvider>
                        </DevicesProvider>
                    </LinksProvider>
                </SharesProvider>
            </VolumesProvider>
        </DriveEventManagerProvider>
    );
};
