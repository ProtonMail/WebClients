import React from 'react';
import { c } from 'ttag';
import {
    Alert,
    Row,
    Radio,
    ButtonGroup,
    Group,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    Button
} from 'react-components';

// TODO: learn more link
const OpenVPNConfigurationSection = () => {
    return (
        <>
            <h2>{c('Title').t`OpenVPN Configuration Files`}</h2>
            <Alert learnMore="todo">
                {c('Info').t`Use this section to generate config files for third party VPN clients
                    or when setting up a connection on a router. If you use a native ProtonVPN
                    client to connect, you do not need to manually handle these configuration files.
                `}
            </Alert>

            <h3 className="mt2">{c('Title').t`1. Select platform`}</h3>
            <Row>
                <Radio name="platform" className="mr2" id="platform-macos">{c('Option').t`MacOS`}</Radio>
                <Radio name="platform" className="mr2" id="platform-linux">{c('Option').t`Linux`}</Radio>
                <Radio name="platform" className="mr2" id="platform-windows">{c('Option').t`Windows`}</Radio>
                <Radio name="platform" className="mr2" id="platform-android">{c('Option').t`Android`}</Radio>
                <Radio name="platform" className="mr2" id="platform-ios">{c('Option').t`iOS`}</Radio>
                <Radio name="platform" className="mr2" id="platform-router">{c('Option').t`Router`}</Radio>
            </Row>

            <h3 className="mt2">{c('Title').t`2. Select protocol`}</h3>
            <Row>
                <Radio name="protocol" className="mr2" id="protocol-udp">{c('Option').t`UDP`}</Radio>
                <Radio name="protocol" className="mr2" id="protocol-tcp">{c('Option').t`TCP`}</Radio>
            </Row>

            <h3 className="mt2">{c('Title').t`3. Select connection and download`}</h3>
            <Group className="mb1-5">
                <ButtonGroup>{c('Tab-Action').t`Secure Core Configs`}</ButtonGroup>
                <ButtonGroup>{c('Tab-Action').t`Country Configs`}</ButtonGroup>
                <ButtonGroup>{c('Tab-Action').t`Server Configs`}</ButtonGroup>
            </Group>

            <h3>{c('Title').t`Secure Core Configs`}</h3>
            <Alert learnMore="todo">
                {c('Info').t`Secure Core configurations add additional protection against VPN endpoint compromise.`}
            </Alert>

            <Table>
                <TableHeader
                    cells={[c('TableHeader').t`Country`, c('TableHeader').t`Status`, c('TableHeader').t`Action`]}
                />
                <TableBody colSpan={3}>
                    <TableRow cells={['Australia', '15%', <Button key="download">{c('Action').t`Download`}</Button>]} />
                </TableBody>
            </Table>
        </>
    );
};

export default OpenVPNConfigurationSection;
