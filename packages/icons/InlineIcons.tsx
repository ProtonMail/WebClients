import { memo } from 'react';

import svgFiles from './assets/file-icons.svg';
import svgIcons from './assets/sprite-icons.svg';
import { ICONS_ID } from './constants';

const Icons = memo(function Icons() {
    return <div id={ICONS_ID} dangerouslySetInnerHTML={{ __html: `${svgIcons}${svgFiles}` }} />;
});

export default Icons;
