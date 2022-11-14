import { useState } from 'react';

import markdownit from 'markdown-it';
import { c } from 'ttag';

import { Button } from '@proton/atoms';

import { getAppVersion } from '../../helpers';
import {
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
} from '../modalTwo';

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
        <Modal size="large" data-testid="changelog-modal" {...rest}>
            <ModalHeader title={c('Title').t`What's new`} />
            <ModalContent>
                <div className="modal-content-inner-changelog" dangerouslySetInnerHTML={html} dir="ltr" lang="en" />
            </ModalContent>
            <ModalFooter>
                <Button data-testid="changelog-modal:close" onClick={rest.onClose}>{c('Action').t`Close`}</Button>
            </ModalFooter>
        </Modal>
    );
};

export default ChangelogModal;
