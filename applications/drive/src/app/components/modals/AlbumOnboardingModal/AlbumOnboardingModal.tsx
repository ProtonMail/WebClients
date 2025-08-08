import { useEffect } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import { useActiveBreakpoint, useModalTwoStatic } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter } from '@proton/components';
import useLocalState from '@proton/components/hooks/useLocalState';
import { useLoading } from '@proton/hooks';
import { DOCS_APP_NAME } from '@proton/shared/lib/constants';
import AlbumOnboardingImage from '@proton/styles/assets/img/onboarding/drive-photo-album-onboarding.png';
import useFlag from '@proton/unleash/useFlag';

import useDriveNavigation from '../../../hooks/drive/useNavigate';
import { usePhotosWithAlbums } from '../../../photos/PhotosStore/PhotosWithAlbumsProvider';
import { Actions, countActionWithTelemetry } from '../../../utils/telemetry';

const LS_KEY = 'modal_album_onboarding_shown';

const AlbumOnboardingModal = ({ onClose, ...props }: ModalProps) => {
    const { navigateToPhotos } = useDriveNavigation();

    useEffect(() => {
        void countActionWithTelemetry(Actions.OnboardingAlbumShown);
    }, []);
    return (
        <ModalTwo {...props} size="small">
            <ModalTwoContent>
                <section className="flex justify-center">
                    <img className="my-4" src={AlbumOnboardingImage} alt={DOCS_APP_NAME} />
                    <h1 className="text-4xl text-bold text-center">{c('Title').t`Photo albums are here!`}</h1>
                    <p className="text-center color-weak text-lg">{c('Subtitle')
                        .t`Securely share your favorite moments with friends and family using Albums.`}</p>
                </section>
            </ModalTwoContent>
            <ModalTwoFooter className="flex gap-4">
                <Button
                    className="mb-0"
                    size="large"
                    color="norm"
                    fullWidth
                    onClick={() => {
                        navigateToPhotos();
                        onClose?.();
                        void countActionWithTelemetry(Actions.OnboardingAlbumPrimaryAction);
                    }}
                >
                    {c('Action').t`Try it now`}
                </Button>
                <Button
                    size="large"
                    color="norm"
                    shape="outline"
                    fullWidth
                    onClick={() => {
                        onClose?.();
                    }}
                    data-testid="drive-onboarding-dismiss"
                >
                    {c('Onboarding Action').t`Maybe later`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export const useAlbumOnboardingModal = () => {
    const [render, show] = useModalTwoStatic(AlbumOnboardingModal);
    const isFlagEnabled = useFlag('DriveAlbumOnboardingModal');
    const [alreadyShown, setAlreadyShown] = useLocalState(false, LS_KEY);
    const { albums, loadAlbums } = usePhotosWithAlbums();
    const [isLoading, withLoading] = useLoading(albums !== undefined);

    const { viewportWidth } = useActiveBreakpoint();
    const isSmallViewport = viewportWidth['<=small'];

    const [user] = useUser();
    const now = Date.now() / 1000;
    const accountAgeInDays = Math.round((now - user.CreateTime) / 3600 / 24);
    const userForLessThanSevenDays = accountAgeInDays < 7;

    const allChecksPass = isFlagEnabled && !isSmallViewport && !userForLessThanSevenDays && !alreadyShown;
    const showModal = allChecksPass && !isLoading && !albums?.size;

    useEffect(() => {
        if (!allChecksPass || !loadAlbums) {
            return;
        }
        const abortController = new AbortController();
        void withLoading(loadAlbums(abortController.signal));

        return () => {
            abortController.abort();
        };
        // not adding withLoading and loadAlbums to avoid infinite rerender
    }, [allChecksPass]);

    useEffect(() => {
        if (showModal) {
            show({});
            setAlreadyShown(true);
        }
    }, [showModal, show]);

    return [render, show] as const;
};
