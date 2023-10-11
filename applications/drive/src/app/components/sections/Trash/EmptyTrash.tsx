import { c } from 'ttag';

import { EmptyViewContainer } from '@proton/components';
import noContentSvg from '@proton/styles/assets/img/illustrations/empty-trash.svg';

const EmptyTrash = () => (
    <div role="presentation" className="flex w-full flex flex-item-fluid overflow-auto">
        <EmptyViewContainer imageProps={{ src: noContentSvg, title: c('Info').t`No files or folders in trash` }}>
            <h3 className="text-bold">{c('Info').t`No files or folders in trash`}</h3>
        </EmptyViewContainer>
    </div>
);

export default EmptyTrash;
