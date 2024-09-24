import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { EmptyViewContainer } from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { DRIVE_LANDING_PAGE } from '@proton/shared/lib/drive/urls';
import noContentSvg from '@proton/styles/assets/img/illustrations/shared-page-empty-list.svg';

import { getIsPublicContext } from '../../../utils/getIsPublicContext';

export const EmptyPlaceholder = () => {
    const isPublicContext = getIsPublicContext();
    const emptyTitle = isPublicContext ? c('Info').t`This folder is empty` : c('Info').t`Nothing here yet`;
    return (
        <div className="flex flex-1 justify-center shared-folder-empty-placeholder-container">
            <EmptyViewContainer
                className="p-4"
                imageProps={{ src: noContentSvg, title: emptyTitle }}
                data-testid="shared-folder-empty-placeholder"
            >
                <h3 className="text-bold">{emptyTitle}</h3>
                {!isPublicContext && (
                    <>
                        <p className="color-hint shared-folder-empty-placeholder-text">
                            {c('Info').t`Need to share a file? Then get ${DRIVE_APP_NAME},
                        the safest way to share, store, and sync your files.`}
                        </p>
                        <div className="flex justify-center">
                            <ButtonLike color="norm" shape="outline" as="a" href={DRIVE_LANDING_PAGE} target="_blank">
                                {c('Action').t`Get ${DRIVE_APP_NAME}`}
                            </ButtonLike>
                        </div>
                    </>
                )}
            </EmptyViewContainer>
        </div>
    );
};
