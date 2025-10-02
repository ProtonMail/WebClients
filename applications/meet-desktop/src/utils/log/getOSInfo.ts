import { cpus, totalmem } from "node:os";

export function getOSInfo() {
    const cpuList = cpus();
    const cpuSpeed = avg(cpuList.map((cpu) => cpu.speed));

    return {
        cpuCount: cpuList.length,
        cpuSpeed: `${Math.round(cpuSpeed / 100) / 10}GHz`,
        totalRAM: `${Math.round((10 * totalmem()) / (1024 * 1024 * 1024)) / 10}GB`,
        mainProcess: getProcessInfo(process),
    };
}

function getProcessInfo(p: NodeJS.Process) {
    const cpuUsage = p.cpuUsage();
    const uptimeSeconds = p.uptime();

    return {
        avgCPUUsage: `${Math.round(((cpuUsage.system + cpuUsage.user) / (uptimeSeconds * 1_000_000)) * 100)}%`,
        memoryUsage: `${Math.round(p.memoryUsage().rss / (1024 * 1024))}MB`,
        uptime: duration(uptimeSeconds),
    };
}

function sum(numberList: number[]) {
    return numberList.reduce((acc, v) => acc + v, 0);
}

function avg(numberList: number[]) {
    return Math.round(sum(numberList) / numberList.length);
}

function duration(seconds: number) {
    let value = seconds;
    if (value < 60) return `${Math.round(value)} seconds`;
    value /= 60;
    if (value < 60) return `${Math.round(value)} minutes`;
    value /= 60;
    if (value < 24) return `${Math.round(value)} hours`;
    value /= 24;
    return `${Math.round(value)} days`;
}
