import React from 'react';
import { Icon, useModals } from 'react-components';

import EditorImageModal from './EditorImageModal';
import EditorLinkModal from './EditorLinkModal';

interface Props {
    id: string;
    getSelection: () => string;
    onAddLink: (url: string, label: string) => void;
    onAddImageUrl: (url: string) => void;
    onAddAttachments: (files: File[]) => void;
}

const EditorToolbar = ({ id, getSelection, onAddLink, onAddImageUrl, onAddAttachments }: Props) => {
    const { createModal } = useModals();

    const handleLink = () => {
        createModal(<EditorLinkModal inputLabel={getSelection()} onSubmit={onAddLink} />);
    };

    const handleImage = () => {
        createModal(<EditorImageModal onAddUrl={onAddImageUrl} onAddAttachments={onAddAttachments} />);
    };

    return (
        <div id={id}>
            <span className="ql-formats">
                <select className="ql-font" defaultValue="">
                    <option></option>
                    <option value="serif"></option>
                    <option value="monospace"></option>
                </select>
                <select className="ql-size" defaultValue="">
                    <option value="small"></option>
                    <option></option>
                    <option value="large"></option>
                    <option value="huge"></option>
                </select>
            </span>
            <span className="ql-formats">
                <button className="ql-bold"></button>
                <button className="ql-italic"></button>
                <button className="ql-underline"></button>
                <button className="ql-strike"></button>
            </span>
            <span className="ql-formats">
                <select className="ql-color">
                    <option value="red"></option>
                    <option value="green"></option>
                    <option value="blue"></option>
                    <option value="orange"></option>
                    <option value="violet"></option>
                    <option value="#d0d1d2"></option>
                    <option></option>
                </select>
                <select className="ql-background">
                    <option value="red"></option>
                    <option value="green"></option>
                    <option value="blue"></option>
                    <option value="orange"></option>
                    <option value="violet"></option>
                    <option value="#d0d1d2"></option>
                    <option></option>
                </select>
            </span>
            <span className="ql-formats">
                <button type="button" onClick={handleLink}>
                    <Icon name="link" />
                </button>
                <button type="button" onClick={handleImage}>
                    <Icon name="file-image" />
                </button>
                <button className="ql-clean"></button>
            </span>
        </div>
    );
};

export default EditorToolbar;
