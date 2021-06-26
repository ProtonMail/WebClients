import React, { useState, useEffect, ChangeEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { c } from 'ttag';

import { reportBug } from '@proton/shared/lib/api/reports';
import { APPS } from '@proton/shared/lib/constants';
import { noop } from '@proton/shared/lib/helpers/function';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { omit } from '@proton/shared/lib/helpers/object';

import AttachScreenshot from './AttachScreenshot';
import { getReportInfo, getClient } from '../../helpers/report';
import {
    Href,
    Info,
    EmailInput,
    Input,
    TextArea,
    Field,
    Row,
    Label,
    Alert,
    Button,
    FormModal,
    Select,
} from '../../components';
import { useApi, useLoading, useConfig, useNotifications, useToggle } from '../../hooks';
import { OptionProps } from '../../components/select/Select';

interface Props {
    username?: string;
    addresses?: { Email: string }[];
    onClose?: () => void;
}

const BugModal = ({ onClose = noop, username: Username = '', addresses = [], ...rest }: Props) => {
    const api = useApi();
    const location = useLocation();
    const [loading, withLoading] = useLoading();
    const { APP_VERSION, CLIENT_TYPE, APP_NAME } = useConfig();

    const mailTitles = [
        { value: 'Sign in problem', text: c('Bug category').t`Sign in problem`, group: c('Group').t`Account` },
        { value: 'Sign up problem', text: c('Bug category').t`Sign up problem`, group: c('Group').t`Account` },
        { value: 'Payments problem', text: c('Bug category').t`Payments problem`, group: c('Group').t`Account` },
        {
            value: 'Custom domain problem',
            text: c('Bug category').t`Custom domain problem`,
            group: c('Group').t`Account`,
        },
        { value: 'Bridge problem', text: c('Bug category').t`Bridge problem`, group: c('Group').t`Apps` },
        {
            value: 'Import / export problem',
            text: c('Bug category').t`Import / export problem`,
            group: c('Group').t`Apps`,
        },
        { value: 'Connection problem', text: c('Bug category').t`Connection problem`, group: c('Group').t`Network` },
        { value: 'Slow speed problem', text: c('Bug category').t`Slow speed problem`, group: c('Group').t`Network` },
        { value: 'Calendar problem', text: c('Bug category').t`Calendar problem`, group: c('Group').t`Services` },
        { value: 'Contacts problem', text: c('Bug category').t`Contacts problem`, group: c('Group').t`Services` },
        { value: 'Drive problem', text: c('Bug category').t`Drive problem`, group: c('Group').t`Services` },
        { value: 'Mail problem', text: c('Bug category').t`Mail problem`, group: c('Group').t`Services` },
        { value: 'VPN problem', text: c('Bug category').t`VPN problem`, group: c('Group').t`Services` },
        { value: 'Feature request', text: c('Bug category').t`Feature request`, group: c('Group').t`Other category` },
        { value: 'Other', text: c('Bug category').t`Other`, group: c('Group').t`Other category` },
    ];

    const vpnTitles = [
        { value: 'Login problem', text: c('Bug category').t`Sign in problem` },
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
    const clearCacheLink = isVpn
        ? 'https://protonvpn.com/support/clear-browser-cache-cookies/'
        : 'https://protonmail.com/support/knowledge-base/how-to-clean-cache-and-cookies/';
    const ClientID = getClientID(APP_NAME);
    const Client = getClient(ClientID);
    const showCategory = !isDrive;
    const { createNotification } = useNotifications();
    const [{ Email = '' } = {}] = addresses;
    const options = titles.reduce<OptionProps[]>(
        (acc, { text, value, group }: { text: string; value: string; group?: string }) => {
            acc.push({ text, value, group });
            return acc;
        },
        [{ text: c('Action to select a title for the bug report modal').t`Select`, value: '', disabled: true }]
    );

    const [model, update] = useState(() => {
        return {
            ...getReportInfo(),
            Title: '',
            Description: '',
            Email: Email || '',
            Username: Username || '',
        };
    });
    const { state: showDetails, toggle: toggleDetails } = useToggle(false);
    const [images, setImages] = useState([]);
    const link = <Href key="linkClearCache" url={clearCacheLink}>{c('Link').t`clearing your browser cache`}</Href>;
    const handleChange =
        (key: string) =>
        ({ target }: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
            update({ ...model, [key]: target.value });

    const handleSubmit = async () => {
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
                ...omit(model, ['OSArtificial']),
                Client,
                ClientVersion: APP_VERSION,
                ClientType: CLIENT_TYPE,
                Title,
            };
        };

        await api(reportBug(getParameters(), 'form'));
        onClose();
        createNotification({ text: c('Success').t`Bug reported` });
    };

    useEffect(() => {
        if (!model.Email && addresses.length) {
            const [{ Email = '' }] = addresses;
            update({ ...model, Email });
        }
    }, [addresses]);

    const OSAndOSVersionFields = (
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
        </>
    );

    return (
        <FormModal
            onClose={onClose}
            onSubmit={() => withLoading(handleSubmit())}
            loading={loading}
            submit={c('Action').t`Submit`}
            title={c('Title').t`Report a problem`}
            {...rest}
        >
            <Alert>{c('Info').jt`Refreshing the page or ${link} will automatically resolve most issues.`}</Alert>
            <Alert type="warning">{c('Warning')
                .t`Reports are not end-to-end encrypted, please do not send any sensitive information.`}</Alert>
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

            {model.OSArtificial && OSAndOSVersionFields}

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
                    {!model.OSArtificial && OSAndOSVersionFields}

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
        </FormModal>
    );
};

export default BugModal;
