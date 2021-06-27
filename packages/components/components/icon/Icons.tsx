import svg from '@proton/styles/assets/img/icons/sprite-icons.svg';
import svgFiles from '@proton/styles/assets/img/icons/file-icons.svg';

export const ICONS_ID = 'icons-root';

const Icons = () => <div id={ICONS_ID} dangerouslySetInnerHTML={{ __html: `${svg}${svgFiles}` }} />;

export default Icons;
