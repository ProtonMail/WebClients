import React, { useState } from 'react';
import { c } from 'ttag';
import markdownit from 'markdown-it';

import { FormModal } from '../modal';
import './ChangeLogModal.scss';
import { getAppVersion } from '../../helpers';

const md = markdownit('default', {
    breaks: true,
    linkify: true,
});

const defaultRender =
    md.renderer.rules.link_open ||
    function render(tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    tokens[idx].attrPush(['target', '_blank']);
    return defaultRender(tokens, idx, options, env, self);
};

interface Props {
    changelog?: string;
}

const ChangelogModal = ({ changelog = '', ...rest }: Props) => {
    const [html] = useState(() => {
        const modifiedChangelog = changelog.replace(/\[(\d+\.\d+\.\d+[^\]]*)]/g, (match, capture) => {
            return `[${getAppVersion(capture)}]`;
        });
        return {
            __html: md.render(modifiedChangelog),
        };
    });

    return (
        <FormModal title={c('Title').t`What's new`} close={c('Action').t`Close`} submit={null} {...rest}>
            <div className="modal-content-inner-changelog" dangerouslySetInnerHTML={html} lang="en" />
        </FormModal>
    );
};

export default ChangelogModal;
