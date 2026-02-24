import os from "node:os";
import fs from "node:fs";
import { app, powerMonitor } from "electron";
import { getSettings } from "../../store/settingsStore";

interface GPUInfoBasic {
    gpuDevice?: Array<{ vendorString?: string; deviceString?: string; driverVersion?: string }>;
}

async function buildGPU() {
    const features = app.getGPUFeatureStatus();
    const info = (await app.getGPUInfo("basic").catch(() => null)) as GPUInfoBasic | null;
    const device = info?.gpuDevice?.[0] ?? null;
    return {
        compositing: features.gpu_compositing,
        vendor: device?.vendorString ?? null,
        deviceName: device?.deviceString ?? null,
        driverVersion: device?.driverVersion ?? null,
    };
}

function buildSystem() {
    const cpus = os.cpus();
    return {
        platform: os.platform(),
        arch: os.arch(),
        osVersion: process.platform === "darwin" ? (process.getSystemVersion?.() ?? os.release()) : os.release(),
        osBuild: os.release(),
        cpuModel: cpus[0]?.model ?? "unknown",
        cpuCount: cpus.length,
        totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024),
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node,
        chromeVersion: process.versions.chrome,
        linuxDesktop: process.platform === "linux" ? (process.env.XDG_CURRENT_DESKTOP ?? null) : null,
        linuxSessionType: process.platform === "linux" ? (process.env.XDG_SESSION_TYPE ?? null) : null,
        linuxDistro: process.platform === "linux" ? readLinuxDistro() : null,
        isSnap: process.env.IS_SNAP === "1",
    };
}

function buildContext() {
    const settings = getSettings();
    // On Linux isOnBatteryPower() requires libupower-glib, which may not be available; set it to null if the call throws;
    let onBattery: boolean | null;
    try {
        onBattery = powerMonitor.isOnBatteryPower();
    } catch {
        onBattery = null;
    }

    return {
        appVersion: app.getVersion(),
        appCacheEnabled: settings.appCacheEnabled ?? true,
        onBattery,
        thermalState: process.platform === "darwin" ? powerMonitor.getCurrentThermalState() : null,
    };
}

function readLinuxDistro(): string | null {
    try {
        const content = fs.readFileSync("/etc/os-release", "utf-8");
        return content.match(/^NAME="?([^"\n]+)"?/m)?.[1] ?? null;
    } catch {
        return null;
    }
}

export const systemContext = { buildContext, buildSystem, buildGPU };
