import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import { EmptyViewContainer } from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import noContentSvg from '@proton/styles/assets/img/illustrations/shared-page-empty-list.svg';

import { DRIVE_LANDING_PAGE } from '../constant';

export const EmptyPlaceholder = () => (
    <div className="flex flex-item-fluid flex-justify-center shared-folder-empty-placeholder-container">
        <EmptyViewContainer
            className="p1"
            imageProps={{ src: noContentSvg, title: c('Info').t`Nothing here yet` }}
            data-test-id="shared-folder-empty-placeholder"
        >
            <h3 className="text-bold">{c('Info').t`Nothing here yet`}</h3>
            <p className="color-hint shared-folder-empty-placeholder-text">
                {c('Info').t`Need to share a file? Then get ${DRIVE_APP_NAME},
                        the safest way to share, store, and sync your files.`}
            </p>
            <div className="flex flex-justify-center">
                <ButtonLike color="norm" shape="outline" as="a" href={DRIVE_LANDING_PAGE} target="_blank">
                    {c('Action').t`Get ${DRIVE_APP_NAME}`}
                </ButtonLike>
            </div>
        </EmptyViewContainer>
    </div>
);
