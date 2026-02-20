import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter } from '@proton/components';
import { DOCS_APP_NAME } from '@proton/shared/lib/constants';
import AlbumOnboardingImage from '@proton/styles/assets/img/onboarding/drive-photo-album-onboarding.png';

export type AlbumOnboardingModalViewProps = ModalProps & {
    onTryItNow: () => void;
};

export const AlbumOnboardingModalView = ({ onClose, onTryItNow, ...props }: AlbumOnboardingModalViewProps) => {
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
                <Button className="mb-0" size="large" color="norm" fullWidth onClick={onTryItNow}>
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
