import type { SyntheticEvent } from 'react';

import LottieView from 'lottie-react';
import { c } from 'ttag';

import TextLoader from '@proton/components/components/loader/TextLoader';
import useConfig from '@proton/components/hooks/useConfig';
import useDocumentTitle from '@proton/components/hooks/useDocumentTitle';
import { getAppShortName } from '@proton/shared/lib/apps/helper';

import { LUMO_FULL_APP_TITLE } from '../constants';
import loader from './Animations/loader.json';

interface Props {
    documentTitle?: string;
    text?: string;
}

const LumoLoader = ({ documentTitle = '', text }: Props) => {
    const { APP_NAME } = useConfig();

    const appName = getAppShortName(APP_NAME);
    const textToDisplay = text || c('Info').t`Loading ${appName}`;

    useDocumentTitle(documentTitle || LUMO_FULL_APP_TITLE);

    const preventDefaultEvent = (e: SyntheticEvent) => e.preventDefault();

    return (
        <div
            className="loader-page h-full"
            // Ignore drag & drop during loading to avoid issue when user drops
            // file too soon before the app is ready causing stop of the app
            // load and showing the file instead.
            onDragOver={preventDefaultEvent}
            onDragEnter={preventDefaultEvent}
            onDragEnd={preventDefaultEvent}
            onDrop={preventDefaultEvent}
        >
            <div className="absolute inset-center text-center">
                <LottieView animationData={loader} loop={true} style={{ width: 180 }} />
                <TextLoader className="color-weak ml-5">{textToDisplay}</TextLoader>
            </div>
        </div>
    );
};

export default LumoLoader;
