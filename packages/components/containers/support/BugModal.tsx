import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { c } from 'ttag';

import { reportBug } from '@proton/shared/lib/api/reports';
import { APPS, VPN_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';
import { omit } from '@proton/shared/lib/helpers/object';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import AttachScreenshot, { Screenshot } from './AttachScreenshot';
import { getReportInfo, getClientName } from '../../helpers/report';
import {
    Button,
    Collapsible,
    Form,
    Href,
    InputFieldTwo,
    ModalProps,
    ModalTwo as Modal,
    ModalTwoHeader as ModalHeader,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    Option,
    SelectTwo,
    TextAreaTwo,
    useFormErrors,
    CollapsibleHeader,
    CollapsibleContent,
    CollapsibleHeaderIconButton,
    Icon,
} from '../../components';
import { useApi, useConfig, useNotifications } from '../../hooks';

export type BugModalMode = 'chat-unavailable' | 'chat-no-agents';

export interface Props {
    username?: string;
    email?: string;
    mode?: BugModalMode;
    onClose: ModalProps['onClose'];
    onExit: ModalProps['onExit'];
    open: ModalProps['open'];
}

type OptionItem = { type: 'label'; value: string } | { type: 'option'; title: string; value: string };

const BugModal = ({ username: Username = '', email, mode, open, onClose, onExit }: Props) => {
    const api = useApi();
    const location = useLocation();
    const [loading, setLoading] = useState(false);

    const handleClose = loading ? noop : onClose;

    const { APP_VERSION, CLIENT_TYPE, APP_NAME } = useConfig();
    const isVpn = APP_NAME === APPS.PROTONVPN_SETTINGS;
    const isDrive = APP_NAME === APPS.PROTONDRIVE;
    const clearCacheLink = isVpn
        ? 'https://protonvpn.com/support/clear-browser-cache-cookies/'
        : getKnowledgeBaseUrl('/how-to-clean-cache-and-cookies');
    const Client = getClientName(APP_NAME);
    const showCategory = !isDrive;
    const { createNotification } = useNotifications();

    const mailOptions: OptionItem[] = [
        { type: 'label', value: c('Group').t`Account` },
        { type: 'option', value: 'Sign in problem', title: c('Bug category').t`Sign in problem` },
        { type: 'option', value: 'Sign up problem', title: c('Bug category').t`Sign up problem` },
        { type: 'option', value: 'Payments problem', title: c('Bug category').t`Payments problem` },
        { type: 'option', value: 'Custom domain problem', title: c('Bug category').t`Custom domain problem` },
        { type: 'label', value: c('Group').t`Apps` },
        { type: 'option', value: 'Bridge problem', title: c('Bug category').t`Bridge problem` },
        { type: 'option', value: 'Import / export problem', title: c('Bug category').t`Import / export problem` },
        { type: 'label', value: c('Group').t`Network` },
        { type: 'option', value: 'Connection problem', title: c('Bug category').t`Connection problem` },
        { type: 'option', value: 'Slow speed problem', title: c('Bug category').t`Slow speed problem` },
        { type: 'label', value: c('Group').t`Services` },
        { type: 'option', value: 'Calendar problem', title: c('Bug category').t`Calendar problem` },
        { type: 'option', value: 'Contacts problem', title: c('Bug category').t`Contacts problem` },
        { type: 'option', value: 'Drive problem', title: c('Bug category').t`Drive problem` },
        { type: 'option', value: 'Mail problem', title: c('Bug category').t`Mail problem` },
        { type: 'option', value: 'VPN problem', title: c('Bug category').t`VPN problem` },
        { type: 'label', value: c('Group').t`Other category` },
        { type: 'option', value: 'Feature request', title: c('Bug category').t`Feature request` },
        { type: 'option', value: 'Other', title: c('Bug category').t`Other` },
    ];

    const vpnOptions: OptionItem[] = [
        { type: 'option', value: 'Login problem', title: c('Bug category').t`Sign in problem` },
        { type: 'option', value: 'Signup problem', title: c('Bug category').t`Signup problem` },
        { type: 'option', value: 'Payments problem', title: c('Bug category').t`Payments problem` },
        { type: 'option', value: 'Installation problem', title: c('Bug category').t`Installation problem` },
        { type: 'option', value: 'Update problem', title: c('Bug category').t`Update problem` },
        { type: 'option', value: 'Application problem', title: c('Bug category').t`Application problem` },
        { type: 'option', value: 'Connection problem', title: c('Bug category').t`Connection problem` },
        { type: 'option', value: 'Speed problem', title: c('Bug category').t`Speed problem` },
        { type: 'option', value: 'Manual setup problem', title: c('Bug category').t`Manual setup problem` },
        { type: 'option', value: 'Website access problem', title: c('Bug category').t`Website access problem` },
        { type: 'option', value: 'Streaming problem', title: c('Bug category').t`Streaming problem` },
        { type: 'option', value: 'Feature request', title: c('Bug category').t`Feature request` },
    ];

    const categoryOptions = (isVpn ? vpnOptions : mailOptions).map((item) => {
        const { type, value } = item;
        if (type === 'label') {
            return (
                <label className="text-semibold px0-5 py0-25 block" key={value}>
                    {value}
                </label>
            );
        }

        const { title } = item;
        return <Option title={title} value={value} key={value} />;
    });

    const [model, setModel] = useState(() => {
        return {
            ...getReportInfo(),
            Title: '',
            Description: '',
            Email: email || '',
            Username: Username || '',
        };
    });
    const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
    const [uploadingScreenshots, setUploadingScreenshots] = useState(false);
    const link = <Href key="linkClearCache" url={clearCacheLink}>{c('Link').t`clearing your browser cache`}</Href>;

    const { validator, onFormSubmit } = useFormErrors();
    const handleChange = (key: keyof typeof model) => {
        return (value: any) => setModel({ ...model, [key]: value });
    };

    const handleSubmit = async () => {
        if (!onFormSubmit()) {
            return;
        }

        setLoading(true);

        const getParameters = () => {
            const screenshotBlobs = screenshots.reduce((acc: { [key: string]: Blob }, { name, blob }) => {
                acc[name] = blob;
                return acc;
            }, {});

            const Title = [!isVpn && '[V5]', `[${Client}] Bug [${location.pathname}]`, model.Title]
                .filter(Boolean)
                .join(' ');

            return {
                ...screenshotBlobs,
                ...omit(model, ['OSArtificial']),
                Client,
                ClientVersion: APP_VERSION,
                ClientType: CLIENT_TYPE,
                Title,
            };
        };

        try {
            await api(reportBug(getParameters(), 'form'));
            onClose?.();
            createNotification({ text: c('Success').t`Bug reported` });
        } catch (error) {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!model.Email && email) {
            setModel({ ...model, Email: email });
        }
    }, [email]);

    const OSAndOSVersionFields = (
        <>
            <InputFieldTwo
                id="OS"
                label={c('Label').t`Operating system`}
                value={model.OS}
                onValue={handleChange('OS')}
                disabled={loading}
            />
            <InputFieldTwo
                id="OSVersion"
                label={c('Label').t`Operating system version`}
                value={model.OSVersion}
                onValue={handleChange('OSVersion')}
                disabled={loading}
            />
        </>
    );

    const modeAlert = (() => {
        if (mode === 'chat-unavailable') {
            return (
                <p>
                    {c('Warning')
                        .t`Live chat is a premium feature available only to those with paid ${VPN_APP_NAME} plans. Please open a ticket instead.`}
                </p>
            );
        }

        if (mode === 'chat-no-agents') {
            return (
                <p>
                    {c('Warning')
                        .t`Unfortunately, we’re not online at the moment. Please complete the form below to describe your issue, and we will look into it and be in touch when we’re back online.`}
                </p>
            );
        }

        return (
            <>
                <p>
                    {c('Info').jt`Refreshing the page or ${link} will automatically resolve most issues.`}
                    <br />
                    <br />
                    {c('Warning')
                        .t`Reports are not end-to-end encrypted, please do not send any sensitive information.`}
                </p>
            </>
        );
    })();

    return (
        <Modal as={Form} open={open} onClose={handleClose} onExit={onExit} onSubmit={handleSubmit}>
            <ModalHeader title={c('Title').t`Report a problem`} />
            <ModalContent>
                {modeAlert}
                {Username ? null : (
                    <InputFieldTwo
                        autoFocus
                        id="Username"
                        label={c('Label').t`Proton username`}
                        value={model.Username}
                        onValue={handleChange('Username')}
                        disabled={loading}
                    />
                )}
                <InputFieldTwo
                    id="Email"
                    label={c('Label').t`Email address`}
                    placeholder={c('Placeholder').t`A way to contact you`}
                    value={model.Email}
                    onValue={handleChange('Email')}
                    error={validator([requiredValidator(model.Email)])}
                    disabled={loading}
                />
                {showCategory && (
                    <InputFieldTwo
                        as={SelectTwo}
                        label={c('Label').t`Category`}
                        placeholder={c('Placeholder').t`Select`}
                        id="Title"
                        value={model.Title}
                        onValue={handleChange('Title')}
                        error={validator([requiredValidator(model.Title)])}
                        disabled={loading}
                    >
                        {categoryOptions}
                    </InputFieldTwo>
                )}
                <InputFieldTwo
                    as={TextAreaTwo}
                    id="Description"
                    label={c('Label').t`What happened?`}
                    placeholder={c('Placeholder').t`Please describe the problem and include any error messages`}
                    value={model.Description}
                    onValue={handleChange('Description')}
                    error={validator([requiredValidator(model.Description)])}
                    rows={5}
                    disabled={loading}
                />
                <AttachScreenshot
                    id="Attachments"
                    screenshots={screenshots}
                    setScreenshots={setScreenshots}
                    uploading={uploadingScreenshots}
                    setUploading={setUploadingScreenshots}
                    disabled={loading}
                />
                {model.OSArtificial && OSAndOSVersionFields}

                <Collapsible className="mt1">
                    <CollapsibleHeader
                        disableFullWidth
                        suffix={
                            <CollapsibleHeaderIconButton size="small">
                                <Icon name="chevron-down" />
                            </CollapsibleHeaderIconButton>
                        }
                    >
                        <label className="text-semibold">{c('Label').t`System information`}</label>
                    </CollapsibleHeader>

                    <CollapsibleContent className="mt1">
                        {!model.OSArtificial && OSAndOSVersionFields}

                        <InputFieldTwo
                            id="Browser"
                            label={c('Label').t`Browser`}
                            value={model.Browser}
                            onValue={handleChange('Browser')}
                            disabled={loading}
                        />
                        <InputFieldTwo
                            id="BrowserVersion"
                            label={c('Label').t`Browser version`}
                            value={model.BrowserVersion}
                            onValue={handleChange('BrowserVersion')}
                            disabled={loading}
                        />
                    </CollapsibleContent>
                </Collapsible>
            </ModalContent>
            <ModalFooter>
                <Button onClick={handleClose} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button loading={loading} disabled={uploadingScreenshots} type="submit" color="norm">
                    {c('Action').t`Submit`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default BugModal;
