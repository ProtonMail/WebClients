import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { reportBug } from 'proton-shared/lib/api/reports';

import { c } from 'ttag';
import {
    Modal,
    Href,
    Alert,
    Row,
    Field,
    Input,
    Button,
    useToggle,
    Info,
    TextArea,
    Select,
    Label,
    ContentModal,
    InnerModal,
    FooterModal,
    EmailInput,
    ResetButton,
    PrimaryButton,
    useApiWithoutResult,
    useNotifications,
    useConfig
} from 'react-components';

import AttachScreenshot from './AttachScreenshot';
import { collectInfo, getClient } from '../../helpers/report';

const BugModal = ({ onClose, username: Username, addresses, titles }) => {
    const { CLIENT_ID, APP_VERSION, CLIENT_TYPE } = useConfig();
    const Client = getClient(CLIENT_ID);
    const { createNotification } = useNotifications();
    const [{ Email = '' } = {}] = addresses;
    const options = titles.reduce(
        (acc, title) => {
            acc.push({
                text: title,
                value: `[${Client}] Bug [${location.path}] ${title}`
            });
            return acc;
        },
        [{ text: c('Option').t`Select`, value: '' }]
    );
    const [model, update] = useState({
        ...collectInfo(),
        Client,
        ClientVersion: APP_VERSION,
        ClientType: CLIENT_TYPE,
        Title: options[0].value,
        Description: '',
        Username,
        Email
    });
    const { state: showDetails, toggle: toggleDetails } = useToggle(false);
    const [images, setImages] = useState([]);
    const { request, loading } = useApiWithoutResult(reportBug);
    const link = (
        <Href
            key="linkClearCache"
            url="https://protonmail.com/support/knowledge-base/how-to-clean-cache-and-cookies/"
        >{c('Link').t`clearing your browser cache`}</Href>
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
        <Modal onClose={onClose} title={c('Title').t`Report bug`}>
            <ContentModal onSubmit={handleSubmit} onReset={onClose} loading={loading}>
                <InnerModal>
                    <Alert>{c('Info')
                        .jt`Refreshing the page or ${link} will automatically resolve most issues.`}</Alert>
                    <Alert type="warning">{c('Warning')
                        .t`Bug reports are not end-to-end encrypted, please do not send any sensitive information.`}</Alert>
                    {Username ? null : (
                        <Row>
                            <Label htmlFor="Username">{c('Label').t`Proton username`}</Label>
                            <Field>
                                <Input
                                    id="Username"
                                    value={model.Username}
                                    onChange={handleChange('Username')}
                                    placeholder={c('Placeholder').t`Proton username`}
                                />
                            </Field>
                        </Row>
                    )}
                    <Row>
                        <Label htmlFor="Email">{c('Label').t`Email address`}</Label>
                        <Field>
                            <EmailInput
                                id="Email"
                                value={model.Email}
                                onChange={handleChange('Email')}
                                placeholder={c('Placeholder').t`Please make sure to give us a way to contact you`}
                                required
                            />
                        </Field>
                    </Row>
                    <Row>
                        <Label htmlFor="Title">{c('Label').t`Category`}</Label>
                        <Field>
                            <Select
                                id="Title"
                                value={model.Title}
                                options={options}
                                onChange={handleChange('Title')}
                                required
                            />
                        </Field>
                    </Row>
                    <Row>
                        <Label htmlFor="Description">{c('Label').t`What happened?`}</Label>
                        <Field>
                            <TextArea
                                id="Description"
                                value={model.Description}
                                onChange={handleChange('Description')}
                                placeholder={c('Placeholder')
                                    .t`Please describe the problem and include any error messages`}
                                required
                            />
                        </Field>
                    </Row>
                    <Row>
                        <Label htmlFor="Attachments">
                            {c('Label').t`Attach screenshots`}{' '}
                            <Info url="https://protonmail.com/support/knowledge-base/screenshot-reporting-bugs/" />
                        </Label>
                        <Field>
                            <AttachScreenshot id="Attachments" onUpload={setImages} onReset={() => setImages([])} />
                        </Field>
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
                                <Field>
                                    <Input
                                        id="OS"
                                        value={model.OS}
                                        onChange={handleChange('OS')}
                                        placeholder={c('Placeholder').t`OS name`}
                                    />
                                </Field>
                            </Row>
                            <Row>
                                <Label htmlFor="OSVersion">{c('Label').t`Operating system version`}</Label>
                                <Field>
                                    <Input
                                        id="OSVersion"
                                        value={model.OSVersion}
                                        onChange={handleChange('OSVersion')}
                                        placeholder={c('Placeholder').t`OS version`}
                                    />
                                </Field>
                            </Row>
                            <Row>
                                <Label htmlFor="Browser">{c('Label').t`Browser`}</Label>
                                <Field>
                                    <Input
                                        id="Browser"
                                        value={model.Browser}
                                        onChange={handleChange('Browser')}
                                        placeholder={c('Placeholder').t`Browser name`}
                                    />
                                </Field>
                            </Row>
                            <Row>
                                <Label htmlFor="BrowserVersion">{c('Label').t`Browser version`}</Label>
                                <Field>
                                    <Input
                                        id="BrowserVersion"
                                        value={model.BrowserVersion}
                                        onChange={handleChange('BrowserVersion')}
                                        placeholder={c('Placeholder').t`Browser version`}
                                    />
                                </Field>
                            </Row>
                        </>
                    ) : null}
                    <Alert>{c('Info').t`Contact us at security@protonmail.com for critical security issues.`}</Alert>
                </InnerModal>
                <FooterModal>
                    <ResetButton>{c('Action').t`Cancel`}</ResetButton>
                    <PrimaryButton type="submit">{c('Action').t`Submit`}</PrimaryButton>
                </FooterModal>
            </ContentModal>
        </Modal>
    );
};

BugModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    username: PropTypes.string,
    addresses: PropTypes.array,
    titles: PropTypes.array
};

BugModal.defaultProps = {
    username: '',
    addresses: [],
    titles: [
        'Login problem',
        'Sign up problem',
        'Bridge problem',
        'Import / export problem',
        'Custom domains problem',
        'Payments problem',
        'VPN problem',
        'Feature request',
        'Other'
    ]
};

export default BugModal;
