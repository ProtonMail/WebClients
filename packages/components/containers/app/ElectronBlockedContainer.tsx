import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import ElectronDraggeableHeaderWrapper from '@proton/components/components/electron/ElectronDraggeableHeaderWrapper';
import { CALENDAR_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import errorGeneric from '@proton/styles/assets/img/errors/error-generic.svg';

import { IllustrationPlaceholder } from '../illustration';

const ElectronBlockedContainer = () => {
    const children = (
        <div className="text-center">
            <p className="mt-0 mb-6">{c('Error message')
                .t`To use ${MAIL_APP_NAME} or ${CALENDAR_APP_NAME}, switch to the web version.`}</p>
            <ButtonLike as="a" target="_blank" href="https://account.proton.me/login">{c('Error message')
                .t`Open in browser`}</ButtonLike>
        </div>
    );

    return (
        <>
            <ElectronDraggeableHeaderWrapper />
            <IllustrationPlaceholder
                className="h100 flex-justify-center"
                title={c('Error message').t`App currently unavailable`}
                url={errorGeneric}
                children={children}
            />
        </>
    );
};

export default ElectronBlockedContainer;
