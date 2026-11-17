import { c } from 'ttag';

import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import { openNewTab } from '@proton/shared/lib/helpers/browser';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import warningImg from '@proton/styles/assets/img/meet/warning-icon.svg';

import { ConfirmationModal } from '../ConfirmationModal/ConfirmationModal';
import { PageHeader } from '../PageHeader/PageHeader';

import '../../containers/PrejoinContainer/PrejoinContainer.scss';

export const E2eeUnsupportedPage = () => {
    return (
        <div className="prejoin-page h-full relative flex flex-column flex-nowrap">
            <div className="prejoin-background" aria-hidden="true">
                <div className="prejoin-glow prejoin-glow--norm" />
                <div className="prejoin-glow prejoin-glow--ground" />
                <div className="prejoin-glow prejoin-glow--deep" />
                <div className="prejoin-glow prejoin-glow--bot" />
                <div className="prejoin-glow prejoin-glow--main" />
            </div>
            <div className="flex-1 min-h-0 relative flex flex-column flex-nowrap">
                <div className="w-full prejoin-padding-x shrink-0">
                    <PageHeader showAppSwitcher={false} />
                </div>
                <main id="main-content" tabIndex={-1} className="flex-1 outline-none" />
            </div>
            <ConfirmationModal
                icon={
                    <img
                        className="w-custom h-custom"
                        src={warningImg}
                        alt=""
                        style={{ '--w-custom': '5rem', '--h-custom': '5rem' }}
                    />
                }
                title={c('Title').t`Can’t join from this browser`}
                message={
                    <>
                        <p className="m-0">
                            {
                                // translator: ${MEET_APP_NAME} is "Proton Meet"
                                c('Info')
                                    .t`This browser doesn’t support the end-to-end encryption ${MEET_APP_NAME} uses to protect every meeting.`
                            }
                        </p>
                        <p className="mt-2 mb-0">
                            {
                                // translator: ${MEET_APP_NAME} is "Proton Meet"
                                c('Info')
                                    .t`To join, use a different browser or device, or the ${MEET_APP_NAME} app on your phone.`
                            }
                        </p>
                    </>
                }
                primaryText={c('Action').t`Learn more`}
                primaryButtonClass="secondary"
                onPrimaryAction={() => openNewTab(getKnowledgeBaseUrl('/recommended-browsers'))}
                showCloseButton={false}
            />
        </div>
    );
};
