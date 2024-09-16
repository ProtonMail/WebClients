import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { DRIVE_LANDING_PAGE } from '@proton/shared/lib/drive/urls';
import notFoundSvg from '@proton/styles/assets/img/illustrations/shared-page-not-found.svg';

import SharedPageLayout from '../Layout/SharedPageLayout';

export default function SharedPageError() {
    return (
        <SharedPageLayout>
            <div className="flex flex-1 items-center py-7 mb-14">
                <div
                    className="password-page--form-container ui-standard w-full relative shadow-lifted max-w-custom mx-auto px-8 py-11 rounded"
                    style={{ '--max-w-custom': '30rem' }}
                >
                    <figure className="flex justify-center pb-7">
                        <img className="h-auto" src={notFoundSvg} alt={c('Info').t`Shared link not found`} />
                    </figure>
                    <h3 className="text-center text-bold">{c('Title').t`Hm, we couldn't find that one`}</h3>
                    <p className="text-center mt-2 mb-14">
                        {c('Info')
                            .t`This file may have been deleted, moved or made unavailable. Try reaching out to the file owner.`}
                    </p>
                    <ButtonLike as="a" size="large" fullWidth color="norm" href={DRIVE_LANDING_PAGE}>
                        {c('Action').t`Back to Homepage`}
                    </ButtonLike>
                </div>
            </div>
        </SharedPageLayout>
    );
}
