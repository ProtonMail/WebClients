import { memo, useEffect, useState } from 'react';

import noop from '@proton/utils/noop';

import svgFilesSprite from './assets/file-icons.svg';
import svgIconsSprite from './assets/sprite-icons.svg';
import { ICONS_ID } from './constants';

// Generate subresource integrity of these svg files so that we don't need to sanitize them.
// We trust our own bundle but not necessarily where the static assets are hosted.
// This is injected at build time by the SriWebpackPlugin.
const svgFilesIntegrity = '__sri_generate__:assets/static/file-icons.*.svg';
const svgIconsIntegrity = '__sri_generate__:assets/static/sprite-icons.*.svg';

const fetchSvgText = (url: string, integrity: string) => {
    return fetch(url, { integrity: integrity || 'sha384-invalid-integrity' }).then((response) => response.text());
};

const Icons = memo(function Icons() {
    const [svg, setSvg] = useState('');

    useEffect(() => {
        const run = async () => {
            const [svgIcons, svgFiles] = await Promise.all([
                fetchSvgText(svgIconsSprite, svgIconsIntegrity),
                fetchSvgText(svgFilesSprite, svgFilesIntegrity),
            ]);
            setSvg(`${svgIcons}${svgFiles}`);
        };
        run().catch(noop);
    }, []);

    return <div id={ICONS_ID} dangerouslySetInnerHTML={{ __html: svg }} />;
});

export default Icons;
