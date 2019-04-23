import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { reportBug } from 'proton-shared/lib/api/reports';

import { c } from 'ttag';
import {
    Modal,
    Href,
    Alert,
    Row,
    Input,
    Button,
    useToggle,
    Info,
    TextArea,
    Label,
    ContentModal,
    FooterModal,
    EmailInput,
    ResetButton,
    PrimaryButton,
    useApiWithoutResult,
    useUser,
    useAddresses,
    useNotifications,
    useConfig
} from 'react-components';

import AttachScreenshot from './AttachScreenshot';
import { collectInfo, getClient } from '../../helpers/report';

const BugModal = ({ show, onClose }) => {
    const { CLIENT_ID, APP_VERSION, CLIENT_TYPE } = useConfig();
    const Client = getClient(CLIENT_ID);
    const [{ Name = '' }] = useUser();
    const { createNotification } = useNotifications();
    const [addresses = []] = useAddresses();
    const [{ Email = '' } = {}] = addresses;

    const [model, update] = useState({
        ...collectInfo(),
        Client,
        ClientVersion: APP_VERSION,
        ClientType: CLIENT_TYPE,
        Title: `[${Client}] Bug [${location.path}]`,
        Description: '',
        Username: Name,
        Email
    });
    const { state: showDetails, toggle: toggleDetails } = useToggle(false);
    const [images, setImages] = useState([]);
    const { request, loading } = useApiWithoutResult(reportBug);
    const link = (
        <Href url="https://protonmail.com/support/knowledge-base/how-to-clean-cache-and-cookies/">{c('Link')
            .t`clearing your browser cache`}</Href>
    );
    const handleChange = (key) => ({ target }) => update({ ...model, [key]: target.value });

    const getParameters = () => {
        return images.reduce(
            (acc, { name, blob }) => {
                acc[name] = blob;
                return acc;
            },
            { ...model }
        );
    };

    const handleSubmit = async () => {
        await request(getParameters(), 'form');
        onClose();
        createNotification({ text: c('Success').t`Bug reported` });
    };

    return (
        <Modal show={show} onClose={onClose} title={c('Title').t`Report bug`}>
            <ContentModal onSubmit={handleSubmit} onReset={onClose} loading={loading}>
                <Alert>{c('Info').jt`Refreshing the page or ${link} will automatically resolve most issues.`}</Alert>
                <Alert type="warning">{c('Warning')
                    .t`Bug reports are not end-to-end encrypted, please do not send any sensitive information.`}</Alert>
                <Row>
                    <Label htmlFor="Email">{c('Label').t`Email address`}</Label>
                    <EmailInput
                        id="Email"
                        value={model.Email}
                        onChange={handleChange('Email')}
                        placeholder={c('Placeholder').t`Please make sure to give us a way to contact you`}
                        required
                    />
                </Row>
                <Row>
                    <Label htmlFor="Description">{c('Label').t`What happened?`}</Label>
                    <TextArea
                        id="Description"
                        value={model.Description}
                        onChange={handleChange('Description')}
                        placeholder={c('Placeholder').t`Please describe the problem and include any error messages`}
                        required
                    />
                </Row>
                <Row>
                    <Label htmlFor="Attachments">
                        {c('Label').t`Attach screenshots`}{' '}
                        <Info url="https://protonmail.com/support/knowledge-base/screenshot-reporting-bugs/" />
                    </Label>
                    <AttachScreenshot id="Attachments" onUpload={setImages} onReset={() => setImages([])} />
                </Row>
                <Row>
                    <Label>{c('Label').t`System information`}</Label>
                    <Button onClick={toggleDetails}>
                        {showDetails ? c('Action').t`Hide info` : c('Action').t`Show info`}
                    </Button>
                </Row>
                {showDetails ? (
                    <>
                        <Row>
                            <Label htmlFor="OS">{c('Label').t`Operating system`}</Label>
                            <Input
                                id="OS"
                                value={model.OS}
                                onChange={handleChange('OS')}
                                placeholder={c('Placeholder').t`OS name`}
                            />
                        </Row>
                        <Row>
                            <Label htmlFor="OSVersion">{c('Label').t`Operating system version`}</Label>
                            <Input
                                id="OSVersion"
                                value={model.OSVersion}
                                onChange={handleChange('OSVersion')}
                                placeholder={c('Placeholder').t`OS version`}
                            />
                        </Row>
                        <Row>
                            <Label htmlFor="Browser">{c('Label').t`Browser`}</Label>
                            <Input
                                id="Browser"
                                value={model.Browser}
                                onChange={handleChange('Browser')}
                                placeholder={c('Placeholder').t`Browser name`}
                            />
                        </Row>
                        <Row>
                            <Label htmlFor="BrowserVersion">{c('Label').t`Browser version`}</Label>
                            <Input
                                id="BrowserVersion"
                                value={model.BrowserVersion}
                                onChange={handleChange('BrowserVersion')}
                                placeholder={c('Placeholder').t`Browser version`}
                            />
                        </Row>
                    </>
                ) : null}
                <Alert>{c('Info').t`Contact us at security@protonmail.com for critical security issues.`}</Alert>
                <FooterModal>
                    <ResetButton>{c('Action').t`Cancel`}</ResetButton>
                    <PrimaryButton type="submit">{c('Action').t`Submit`}</PrimaryButton>
                </FooterModal>
            </ContentModal>
        </Modal>
    );
};

BugModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
};

export default BugModal;
