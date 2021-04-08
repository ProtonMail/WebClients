import React from 'react';
import svg from 'design-system/_includes/sprite-icons.svg';

export const ICONS_ID = 'icons-root';

const Icons = () => <div id={ICONS_ID} dangerouslySetInnerHTML={{ __html: svg }} />;

export default Icons;
