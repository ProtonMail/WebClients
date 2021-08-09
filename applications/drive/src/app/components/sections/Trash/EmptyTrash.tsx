import { c } from 'ttag';

import { EmptyViewContainer } from '@proton/components';

import noContentSvg from '@proton/styles/assets/img/placeholders/empty-trash.svg';

const EmptyTrash = () => (
    <EmptyViewContainer imageProps={{ src: noContentSvg, title: c('Info').t`No files or folders in trash` }}>
        <h3 className="text-bold">{c('Info').t`No files or folders in trash`}</h3>
    </EmptyViewContainer>
);

export default EmptyTrash;
