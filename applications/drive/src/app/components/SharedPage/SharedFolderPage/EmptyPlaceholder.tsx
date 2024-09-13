import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { EmptyViewContainer } from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { DRIVE_LANDING_PAGE } from '@proton/shared/lib/drive/urls';
import noContentSvg from '@proton/styles/assets/img/illustrations/shared-page-empty-list.svg';

export const EmptyPlaceholder = () => (
    <div className="flex flex-1 justify-center shared-folder-empty-placeholder-container">
        <EmptyViewContainer
            className="p-4"
            imageProps={{ src: noContentSvg, title: c('Info').t`Nothing here yet` }}
            data-testid="shared-folder-empty-placeholder"
        >
            <h3 className="text-bold">{c('Info').t`Nothing here yet`}</h3>
            <p className="color-hint shared-folder-empty-placeholder-text">
                {c('Info').t`Need to share a file? Then get ${DRIVE_APP_NAME},
                        the safest way to share, store, and sync your files.`}
            </p>
            <div className="flex justify-center">
                <ButtonLike color="norm" shape="outline" as="a" href={DRIVE_LANDING_PAGE} target="_blank">
                    {c('Action').t`Get ${DRIVE_APP_NAME}`}
                </ButtonLike>
            </div>
        </EmptyViewContainer>
    </div>
);
