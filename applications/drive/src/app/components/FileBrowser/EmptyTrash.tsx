import React from 'react';
import { c } from 'ttag';

import { IllustrationPlaceholder } from 'react-components';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';

import noContentSvgLight from 'design-system/assets/img/pd-images/no-trash.svg';
import noContentSvgDark from 'design-system/assets/img/pd-images/no-trash-dark.svg';

const EmptyTrash = () => (
    <div className="p2 mt2 flex w100 flex flex-item-fluid">
        <IllustrationPlaceholder
            url={getLightOrDark(noContentSvgLight, noContentSvgDark)}
            title={c('Info').t`No files or folders in trash`}
        />
    </div>
);

export default EmptyTrash;
