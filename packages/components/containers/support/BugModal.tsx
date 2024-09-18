import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Form,
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    type ModalProps,
    Option,
    SelectTwo,
    TextAreaTwo,
    useFormErrors,
} from '@proton/components';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import Icon from '@proton/components/components/icon/Icon';
import { reportBug } from '@proton/shared/lib/api/reports';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, BRAND_NAME, CLIENT_TYPES } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { omit } from '@proton/shared/lib/helpers/object';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { getClientName, getReportInfo } from '../../helpers/report';
import { useApi, useConfig, useNotifications } from '../../hooks';
import type { Screenshot } from './AttachScreenshot';
import AttachScreenshot from './AttachScreenshot';

export type BugModalMode = 'chat-no-agents';

type OptionLabelItem = { type: 'label'; value: string };
type OptionOptionItem = {
    type: 'option';
    title: string;
    value: string;
    clientType?: CLIENT_TYPES;
    app?: APP_NAMES;
};
type OptionItem = OptionOptionItem | OptionLabelItem;

interface Model extends ReturnType<typeof getReportInfo> {
    Category: OptionOptionItem | undefined;
    Description: string;
    Email: string;
    Username: string;
}

export interface Props {
    username?: string;
    email?: string;
    mode?: BugModalMode;
    onClose: ModalProps['onClose'];
    onExit: ModalProps['onExit'];
    open: ModalProps['open'];
    app?: APP_NAMES;
}

const getMailOptions = (): OptionItem[] => {
    const optionType = 'option' as const;
    const labelType = 'label' as const;
    return [
        { type: labelType, value: c('Group').t`Account` },
        { type: optionType, value: 'Sign in problem', title: c('Bug category').t`Sign in problem` },
        { type: optionType, value: 'Sign up problem', title: c('Bug category').t`Sign up problem` },
        { type: optionType, value: 'Payments problem', title: c('Bug category').t`Payments problem` },
        { type: optionType, value: 'Custom domain problem', title: c('Bug category').t`Custom domain problem` },
        { type: labelType, value: c('Group').t`Apps` },
        { type: optionType, value: 'Bridge problem', title: c('Bug category').t`Bridge problem` },
        { type: optionType, value: 'Import / export problem', title: c('Bug category').t`Import / export problem` },
        { type: labelType, value: c('Group').t`Network` },
        { type: optionType, value: 'Connection problem', title: c('Bug category').t`Connection problem` },
        { type: optionType, value: 'Slow speed problem', title: c('Bug category').t`Slow speed problem` },
        { type: labelType, value: c('Group').t`Services` },
        {
            type: optionType,
            value: 'Calendar problem',
            title: c('Bug category').t`Calendar problem`,
            app: APPS.PROTONCALENDAR,
        },
        { type: optionType, value: 'Contacts problem', title: c('Bug category').t`Contacts problem` },
        {
            type: optionType,
            value: 'Drive problem',
            title: c('Bug category').t`Drive problem`,
            app: APPS.PROTONDRIVE,
        },
        {
            type: optionType,
            value: 'Docs problem',
            title: c('Bug category').t`Docs problem`,
            app: APPS.PROTONDOCS,
        },
        {
            type: optionType,
            value: 'Mail problem',
            title: c('Bug category').t`Mail problem`,
            app: APPS.PROTONMAIL,
        },
        {
            type: optionType,
            value: 'VPN problem',
            title: c('Bug category').t`VPN problem`,
            clientType: CLIENT_TYPES.VPN,
            app: APPS.PROTONVPN_SETTINGS,
        },
        {
            type: optionType,
            value: 'Pass problem',
            title: c('Bug category').t`Pass problem`,
            clientType: CLIENT_TYPES.PASS,
            app: APPS.PROTONPASS,
        },
        {
            type: optionType,
            value: 'Wallet problem',
            title: c('wallet_signup_2024:Bug category').t`Wallet problem`,
            clientType: CLIENT_TYPES.WALLET,
            app: APPS.PROTONWALLET,
        },
        { type: labelType, value: c('Group').t`Other category` },
        { type: optionType, value: 'Feature request', title: c('Bug category').t`Feature request` },
        { type: optionType, value: 'Other', title: c('Bug category').t`Other` },
    ].filter(isTruthy);
};

const getVPNOptions = (): OptionItem[] => {
    return [
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
};

const BugModal = ({ username: Username = '', email, mode, open, onClose, onExit, app: maybeApp }: Props) => {
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

    const options = useMemo(() => {
        return isVpn ? getVPNOptions() : getMailOptions();
    }, []);

    const categoryOptions = options.map((option) => {
        const { type, value } = option;
        if (type === 'label') {
            return (
                <label className="text-semibold px-2 py-1 block" key={value}>
                    {value}
                </label>
            );
        }

        const { title } = option;
        return <Option title={title} value={option} key={value} />;
    });

    const [model, setModel] = useState<Model>(() => {
        const app = maybeApp || APP_NAME;
        const defaultCategory = options.find(
            (option): option is OptionOptionItem => option.type === 'option' && option.app === app
        );
        return {
            ...getReportInfo(),
            Category: defaultCategory,
            Description: '',
            Email: email || '',
            Username: Username || '',
        };
    });
    const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
    const [uploadingScreenshots, setUploadingScreenshots] = useState(false);
    const link = <Href key="linkClearCache" href={clearCacheLink}>{c('Link').t`clearing your browser cache`}</Href>;

    const { validator, onFormSubmit } = useFormErrors();

    const setModelDiff = (model: Partial<Model>) => {
        setModel((oldModel) => ({ ...oldModel, ...model }));
    };
    const handleChange = <K extends keyof Model>(key: K) => {
        return (value: Model[K]) => setModelDiff({ [key]: value });
    };

    const categoryTitle = model.Category?.title || '';
    const clientType = model.Category?.clientType || CLIENT_TYPE;

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

            const Title = [!isVpn && '[V5]', `[${Client}] Bug [${location.pathname}]`, categoryTitle]
                .filter(Boolean)
                .join(' ');

            return {
                ...screenshotBlobs,
                ...omit(model, ['OSArtificial', 'Category']),
                Trigger: mode || '',
                Client,
                ClientVersion: APP_VERSION,
                ClientType: clientType,
                Title,
            };
        };

        try {
            await api(reportBug(getParameters(), 'form'));
            onClose?.();
            createNotification({ text: c('Success').t`Problem reported` });
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

    // Retrieves the selected option by title to ensure referential equality for Select's value
    const selectedValue = options.find(
        (option) => (option.type === 'option' && option.title === model.Category?.title) || ''
    );

    return (
        <Modal as={Form} open={open} onClose={handleClose} onExit={onExit} onSubmit={handleSubmit}>
            <ModalHeader title={c('Title').t`Report a problem`} />
            <ModalContent>
                {modeAlert}
                {Username ? null : (
                    <InputFieldTwo
                        autoFocus
                        id="Username"
                        label={c('Label').t`${BRAND_NAME} username`}
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
                        as={SelectTwo<OptionItem>}
                        label={c('Label').t`Category`}
                        placeholder={c('Placeholder').t`Select`}
                        id="Title"
                        value={selectedValue}
                        onValue={(option: OptionItem) => {
                            if (option.type === 'option') {
                                setModelDiff({ Category: option });
                            }
                        }}
                        error={validator([requiredValidator(categoryTitle)])}
                        disabled={loading}
                        size={{
                            width: DropdownSizeUnit.Anchor,
                            maxWidth: DropdownSizeUnit.Viewport,
                            maxHeight: '16em',
                        }}
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

                <Collapsible className="mt-4">
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

                    <CollapsibleContent className="mt-4">
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
