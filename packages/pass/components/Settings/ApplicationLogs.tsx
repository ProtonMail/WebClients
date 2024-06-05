import { type CSSProperties, type FC, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Scroll } from '@proton/atoms/Scroll';
import { Icon } from '@proton/components/components';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { type Maybe } from '@proton/pass/types';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { SettingsPanel } from './SettingsPanel';

type Props = { opened?: true; style?: CSSProperties };

const downloadLogs = (logs: string[]) => {
    const file = new File(
        logs.map((line) => `${line}\n`),
        `${PASS_APP_NAME}_logs_${Date.now()}`,
        {
            // Safari extensions require 'application/octet-stream' to trigger a download
            type: BUILD_TARGET === 'safari' ? 'application/octet-stream' : 'text/plain',
        }
    );

    // Safari extensions don't properly support the HTML download attribute nor createObjectURL
    if (BUILD_TARGET === 'safari') {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            const base64data = reader.result as string;
            const link = document.createElement('a');
            link.href = base64data;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        return;
    }

    const link = document.createElement('a');
    const url = URL.createObjectURL(file);

    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

export const ApplicationLogs: FC<Props> = ({ opened, style }) => {
    const { getLogs } = usePassCore();
    const intervalRef = useRef<Maybe<NodeJS.Timeout>>();

    const [showLogs, setShowLogs] = useState(opened ?? false);
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        const read = async () => setLogs(await getLogs().catch(() => []));
        void (showLogs && read());

        intervalRef.current = showLogs ? setInterval(read, 1_000) : undefined;
        return () => clearInterval(intervalRef.current);
    }, [showLogs]);

    return (
        <SettingsPanel title={c('Label').t`Application logs`} className="flex-1" contentClassname="py-0">
            {showLogs ? (
                <>
                    {!opened && (
                        <Button
                            className="absolute top-0 right-0 mt-3 mr-2 z-0"
                            color="weak"
                            icon
                            onClick={() => setShowLogs(false)}
                            pill
                            shape="ghost"
                            size="small"
                        >
                            <Icon name="cross" size={3} />
                        </Button>
                    )}

                    <Scroll className="h-custom overflow-auto" style={style}>
                        <div className="py-2">
                            {logs.map((log, i) => (
                                <span key={i} className="block text-xs color-weak text-monospace text-ellipsis">
                                    {log}
                                </span>
                            ))}
                        </div>
                    </Scroll>
                </>
            ) : (
                <Button
                    shape="ghost"
                    color="norm"
                    size="small"
                    className="bg-weak rounded-none w-full"
                    onClick={() => setShowLogs(true)}
                >
                    <div className="flex items-center justify-center gap-2 p-8 text-sm">
                        <Icon name="window-terminal" />
                        <span>{c('Label').t`View logs`}</span>
                    </div>
                </Button>
            )}

            <hr className="border-weak mt-0 mb-2 shrink-0" />

            <Button shape="underline" size="small" onClick={async () => downloadLogs(await getLogs().catch(() => []))}>
                <div className="flex items-center gap-2 text-sm">
                    <Icon name="arrow-down-to-square" />
                    <span>{c('Label').t`Download logs`}</span>
                </div>
            </Button>
        </SettingsPanel>
    );
};
