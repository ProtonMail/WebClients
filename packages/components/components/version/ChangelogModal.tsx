import { useState } from 'react';
import { c } from 'ttag';
import markdownit from 'markdown-it';

import { getAppVersion } from '../../helpers';
import {
    ModalProps,
    ModalTwo as Modal,
    ModalTwoHeader as ModalHeader,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
} from '../modalTwo';
import { Button } from '../button';

import './ChangeLogModal.scss';

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

interface Props extends ModalProps {
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
        <Modal size="large" {...rest}>
            <ModalHeader title={c('Title').t`What's new`} />
            <ModalContent>
                <div className="modal-content-inner-changelog" dangerouslySetInnerHTML={html} dir="ltr" lang="en" />
            </ModalContent>
            <ModalFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Close`}</Button>
            </ModalFooter>
        </Modal>
    );
};

export default ChangelogModal;
