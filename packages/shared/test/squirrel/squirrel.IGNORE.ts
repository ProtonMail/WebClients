import * as electronModule from 'electron';

import { parseInstallArguments } from '@proton/shared/lib/squirrel/squirrel';

describe('squirrel', () => {
    beforeEach(() => {
        spyOnAllFunctions(electronModule);
    });

    describe('install arguments', () => {
        it('should correctly parse want desktop shortcut', () => {
            expect(
                parseInstallArguments(['--squirrel-install', '0.0.1', '--silent', '--no-op', '--desktop-shortcut', '0'])
                    .wantDesktopShortcut
            ).toBe(false);
            expect(
                parseInstallArguments(['--squirrel-install', '0.0.1', '--silent', '--no-op', '--desktop-shortcut', '1'])
                    .wantDesktopShortcut
            ).toBe(true);
            expect(
                parseInstallArguments(['--squirrel-install', '0.0.1', '--silent', '--no-op', '--desktop-shortcut=0'])
                    .wantDesktopShortcut
            ).toBe(false);
            expect(
                parseInstallArguments(['--squirrel-install', '0.0.1', '--silent', '--no-op', '--desktop-shortcut=1'])
                    .wantDesktopShortcut
            ).toBe(true);
            expect(
                parseInstallArguments(['--squirrel-install', '0.0.1', '--silent', '--no-op']).wantDesktopShortcut
            ).toBe(true);
        });
        it('should correctly parse source', () => {
            expect(
                parseInstallArguments(['--squirrel-install', '0.0.1', '--silent', '--no-op']).source
            ).toBeUndefined();
            expect(
                parseInstallArguments([
                    '--squirrel-install',
                    '0.0.1',
                    '--silent',
                    '--no-op',
                    '--source',
                    'fromInstaller',
                ]).source
            ).toBe('fromInstaller');
            expect(
                parseInstallArguments([
                    '--squirrel-install',
                    '0.0.1',
                    '--silent',
                    '--no-op',
                    '--source',
                    `"fromInstaller"`,
                ]).source
            ).toBe('"fromInstaller"');
            expect(
                parseInstallArguments([
                    '--squirrel-install',
                    '0.0.1',
                    '--silent',
                    '--no-op',
                    '--source',
                    `'fromInstaller'`,
                ]).source
            ).toBe("'fromInstaller'");
            expect(
                parseInstallArguments([
                    '--squirrel-install',
                    '0.0.1',
                    '--silent',
                    '--no-op',
                    '--source',
                    'from',
                    'Installer',
                ]).source
            ).toBe('from');
            expect(
                parseInstallArguments(['--squirrel-install', '0.0.1', '--silent', '--no-op', '--source=fromInstaller'])
                    .source
            ).toBe('fromInstaller');
        });
        it('should correctly parse is silent', () => {
            expect(parseInstallArguments(['--squirrel-install', '0.0.1', '-s', '--no-op']).isSilent).toBe(true);
            expect(parseInstallArguments(['--squirrel-install', '0.0.1', '--silent', '--no-op']).isSilent).toBe(true);
            expect(parseInstallArguments(['--squirrel-install', '0.0.1', '--silent', '1', '--no-op']).isSilent).toBe(
                true
            );
            expect(parseInstallArguments(['--squirrel-install', '0.0.1', '--silent=1', '--no-op']).isSilent).toBe(true);
            expect(parseInstallArguments(['--squirrel-install', '0.0.1', '--silent', '0', '--no-op']).isSilent).toBe(
                false
            );
            expect(parseInstallArguments(['--squirrel-install', '0.0.1', '--silent=0', '--no-op']).isSilent).toBe(
                false
            );
            expect(parseInstallArguments(['--squirrel-install', '0.0.1', '--no-op']).isSilent).toBe(false);
        });
        it('should correctly parse is auto launch', () => {
            expect(
                parseInstallArguments(['--squirrel-install', '0.0.1', '--silent', '--no-op', '--auto-launch'])
                    .isAutoLaunch
            ).toBe(true);
            expect(
                parseInstallArguments(['--squirrel-install', '0.0.1', '--silent', '--no-op', '--auto-launch', '1'])
                    .isAutoLaunch
            ).toBe(true);
            expect(
                parseInstallArguments(['--squirrel-install', '0.0.1', '--silent', '--no-op', '--auto-launch=1'])
                    .isAutoLaunch
            ).toBe(true);
            expect(
                parseInstallArguments(['--squirrel-install', '0.0.1', '--silent', '--no-op', '--source=fromInstaller'])
                    .isAutoLaunch
            ).toBe(true);

            expect(parseInstallArguments(['--squirrel-install', '0.0.1', '--silent', '--no-op']).isAutoLaunch).toBe(
                true
            );
            expect(
                parseInstallArguments(['--squirrel-install', '0.0.1', '--silent', '1', '--no-op']).isAutoLaunch
            ).toBe(true);
            expect(parseInstallArguments(['--squirrel-install', '0.0.1', '--silent=1', '--no-op']).isAutoLaunch).toBe(
                true
            );
        });
    });
});
