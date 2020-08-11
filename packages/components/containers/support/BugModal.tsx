import React, { useState, useEffect, ChangeEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { c } from 'ttag';

import { reportBug } from 'proton-shared/lib/api/reports';
import { APPS } from 'proton-shared/lib/constants';
import { noop } from 'proton-shared/lib/helpers/function';

import AttachScreenshot from './AttachScreenshot';
import { collectInfo, getClient } from '../../helpers/report';
import useApi from '../api/useApi';
import useLoading from '../../hooks/useLoading';
import useConfig from '../config/useConfig';
import useNotifications from '../notifications/useNotifications';
import useToggle from '../../components/toggle/useToggle';

import Href from '../../components/link/Href';
import Info from '../../components/link/Info';
import EmailInput from '../../components/input/EmailInput';
import Input from '../../components/input/Input';
import TextArea from '../../components/input/TextArea';
import Field from '../../components/container/Field';
import Row from '../../components/container/Row';
import Label from '../../components/label/Label';
import Alert from '../../components/alert/Alert';
import { Button } from '../../components/button';
import FormModal from '../../components/modal/FormModal';
import Select from '../../components/select/Select';

interface Props {
    username?: string;
    addresses?: { Email: string }[];
    onClose?: () => void;
}

const BugModal = ({ onClose = noop, username: Username = '', addresses = [], ...rest }: Props) => {
    const api = useApi();
    const location = useLocation();
    const [loading, withLoading] = useLoading();
    const { CLIENT_ID, APP_VERSION, CLIENT_TYPE, APP_NAME } = useConfig();

    const mailTitles = [
        { value: 'Login problem', text: c('Bug category').t`Login problem` },
        { value: 'Sign up problem', text: c('Bug category').t`Sign up problem` },
        { value: 'Bridge problem', text: c('Bug category').t`Bridge problem` },
        { value: 'Import / export problem', text: c('Bug category').t`Import / export problem` },
        { value: 'Custom domains problem', text: c('Bug category').t`Custom domains problem` },
        { value: 'Payments problem', text: c('Bug category').t`Payments problem` },
        { value: 'Connection problem', text: c('Bug category').t`Connection problem` },
        { value: 'Slow speed problem', text: c('Bug category').t`Slow speed problem` },
        { value: 'VPN problem', text: c('Bug category').t`VPN problem` },
        { value: 'Feature request', text: c('Bug category').t`Feature request` },
        { value: 'Other', text: c('Bug category').t`Other` },
    ];

    const vpnTitles = [
        { value: 'Login problem', text: c('Bug category').t`Login problem` },
        { value: 'Signup problem', text: c('Bug category').t`Signup problem` },
        { value: 'Payments problem', text: c('Bug category').t`Payments problem` },
        { value: 'Installation problem', text: c('Bug category').t`Installation problem` },
        { value: 'Update problem', text: c('Bug category').t`Update problem` },
        { value: 'Application problem', text: c('Bug category').t`Application problem` },
        { value: 'Connection problem', text: c('Bug category').t`Connection problem` },
        { value: 'Speed problem', text: c('Bug category').t`Speed problem` },
        { value: 'Manual setup problem', text: c('Bug category').t`Manual setup problem` },
        { value: 'Website access problem', text: c('Bug category').t`Website access problem` },
        { value: 'Streaming problem', text: c('Bug category').t`Streaming problem` },
        { value: 'Feature request', text: c('Bug category').t`Feature request` },
    ];

    const isVpn = APP_NAME === APPS.PROTONVPN_SETTINGS;
    const isDrive = APP_NAME === APPS.PROTONDRIVE;

    const titles = isVpn ? vpnTitles : mailTitles;
    const criticalEmail = isVpn ? 'contact@protonvpn.com' : 'security@protonmail.com';
    const clearCacheLink = isVpn
        ? 'https://protonvpn.com/support/clear-browser-cache-cookies/'
        : 'https://protonmail.com/support/knowledge-base/how-to-clean-cache-and-cookies/';
    const Client = getClient(CLIENT_ID);
    const showCategory = !isDrive;
    const { createNotification } = useNotifications();
    const [{ Email = '' } = {}] = addresses;
    const options = titles.reduce(
        (acc, { text, value }) => {
            acc.push({ text, value, disabled: false });
            return acc;
        },
        [{ text: c('Action to select a title for the bug report modal').t`Select`, value: '', disabled: true }]
    );
    const [model, update] = useState({
        ...collectInfo(),
        Title: '',
        Description: '',
        Email,
        Username,
    });
    const { state: showDetails, toggle: toggleDetails } = useToggle(false);
    const [images, setImages] = useState([]);
    const link = <Href key="linkClearCache" url={clearCacheLink}>{c('Link').t`clearing your browser cache`}</Href>;
    const handleChange = (key: string) => ({
        target,
    }: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        update({ ...model, [key]: target.value });

    const getParameters = () => {
        const imageBlobs = images.reduce((acc, { name, blob }) => {
            acc[name] = blob;
            return acc;
        }, {});

        const Title = [!isVpn && '[V4]', `[${Client}] Bug [${location.pathname}]`, model.Title]
            .filter(Boolean)
            .join(' ');

        return {
            ...imageBlobs,
            ...model,
            Client,
            ClientVersion: APP_VERSION,
            ClientType: CLIENT_TYPE,
            Title,
        };
    };

    const handleSubmit = async () => {
        const data = getParameters();
        await api(reportBug(data, 'form'));
        onClose();
        createNotification({ text: c('Success').t`Bug reported` });
    };

    useEffect(() => {
        if (!model.Email && addresses.length) {
            const [{ Email = '' }] = addresses;
            update({ ...model, Email });
        }
    }, [addresses]);

    return (
        <FormModal
            onClose={onClose}
            onSubmit={() => withLoading(handleSubmit())}
            loading={loading}
            submit={c('Action').t`Submit`}
            title={c('Title').t`Report bug`}
            {...rest}
        >
            <Alert>{c('Info').jt`Refreshing the page or ${link} will automatically resolve most issues.`}</Alert>
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
                        placeholder={c('Placeholder').t`A way to contact you`}
                        required
                    />
                </Field>
            </Row>
            {showCategory && (
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
            )}
            <Row>
                <Label htmlFor="Description">{c('Label').t`What happened?`}</Label>
                <Field>
                    <TextArea
                        id="Description"
                        value={model.Description}
                        onChange={handleChange('Description')}
                        placeholder={c('Placeholder').t`Please describe the problem and include any error messages`}
                        required
                    />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="Attachments">
                    <span className="mr0-5">{c('Label, make it short please').t`Attach screenshot(s)`}</span>
                    <Info url="https://protonmail.com/support/knowledge-base/screenshot-reporting-bugs/" />
                </Label>
                <Field className="inline-flex">
                    <AttachScreenshot id="Attachments" onUpload={setImages} onReset={() => setImages([])} />
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`System information`}</Label>
                <Field className="inline-flex">
                    <Button onClick={toggleDetails}>
                        {showDetails ? c('Action').t`Hide info` : c('Action').t`Show info`}
                    </Button>
                </Field>
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
            <Alert>{c('Info').t`Contact us at ${criticalEmail} for critical security issues.`}</Alert>
        </FormModal>
    );
};

export default BugModal;
