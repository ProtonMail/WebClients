import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import type { ModalStateProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, useModalTwoStatic } from '@proton/components';
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

import { Actions, countActionWithTelemetry } from '../../utils/telemetry';
import business from './business.webp';

function SuggestBusinessModal({ ...modalProps }: ModalStateProps) {
    return (
        <ModalTwo {...modalProps} size="large">
            <div style={{ backgroundColor: '#1B1341' }}>
                <IcCrossBig
                    className="absolute right-0 top-0 m-4 cursor-pointer"
                    color="white"
                    onClick={modalProps.onClose}
                />
                <img src={business} alt={c('Label').t`Applications in a business setting`} />
            </div>

            <ModalTwoContent className="text-center mt-8">
                <span className="h2 text-bold mb-2">{c('Info').t`One encrypted suite. Full business protection.`}</span>
                <span className="color-weak">{c('Info')
                    .t`${BRAND_NAME} Workspace empowers your team to collaborate efficiently without ever putting your company's data at risk.`}</span>
            </ModalTwoContent>

            <ModalTwoFooter className="flex gap-4">
                <ButtonLike
                    as="a"
                    href={getStaticURL('/business/drive?ref=drive-bl-button')}
                    target="_blank"
                    className="flex-1"
                    size="large"
                >{c('Action').t`Explore more`}</ButtonLike>
                <ButtonLike
                    onClick={() => countActionWithTelemetry(Actions.RedirectToB2BWorkspaceSignUp)}
                    as="a"
                    href={getAppHref('/drive/signup/business?billing=12&trial=true&users=5', APPS.PROTONACCOUNT)}
                    target="_blank"
                    className="flex-1"
                    size="large"
                    color="norm"
                >{c('Action').t`Create business account`}</ButtonLike>
            </ModalTwoFooter>
        </ModalTwo>
    );
}

export function useSuggestBusinessModal() {
    return useModalTwoStatic(SuggestBusinessModal);
}
