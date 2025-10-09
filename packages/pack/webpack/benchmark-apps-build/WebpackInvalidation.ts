/* eslint-disable no-console */
import { execSync } from 'child_process';
import type { Compiler } from 'webpack';

class WebpackMonitor {
    private peakRam = 0;
    private currentRam = 0;
    private currentCpu = 0;

    update(): void {
        const stats = this.stats();
        this.currentRam = stats.ram;

        this.currentCpu = stats.cpu;
        if (stats.ram > this.peakRam) {
            this.peakRam = stats.ram;
        }
    }

    getStats() {
        return {
            ram: this.currentRam,
            peakRam: this.peakRam,
            cpu: this.currentCpu,
        };
    }

    private stats() {
        const output = execSync(`ps -p ${process.pid} -o %cpu=,rss=`, {
            encoding: 'utf8',
        }).trim();
        const [cpu, rssKB] = output.split(/\s+/);
        return { cpu: parseFloat(cpu), ram: parseInt(rssKB, 10) * 1024 };
    }

    static format(bytes: number): string {
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

export class WebpackInvalidation {
    private monitor = new WebpackMonitor();

    apply(compiler: Compiler): void {
        let start = Date.now();
        let rebuilt = 0;
        let cached = 0;

        compiler.hooks.invalid.tap('WebpackInvalidation', (file) => {
            console.log(`\n🔄 Changed: ${file}`);
            start = Date.now();
            rebuilt = 0;
            cached = 0;
            this.monitor.update();
        });

        compiler.hooks.compilation.tap('WebpackInvalidation', (compilation) => {
            compilation.hooks.buildModule.tap('WebpackInvalidation', () => rebuilt++);
            compilation.hooks.stillValidModule.tap('WebpackInvalidation', () => cached++);
        });

        compiler.hooks.done.tap('WebpackInvalidation', (stats) => {
            this.monitor.update();

            const info = stats.toJson({
                all: false,
                modules: true,
                cachedModules: true,
            });
            const invalidated = info.modules?.filter((mod) => !mod.cached)?.length || 0;
            const total = info.modules?.length || 0;
            const monitor = this.monitor.getStats();
            const dt = Date.now() - start;

            const ram = WebpackMonitor.format(monitor.ram);
            const peakRam = WebpackMonitor.format(monitor.peakRam);
            const cpu = monitor.cpu.toFixed(1);

            console.log(`\n📊 ${dt}ms | Rebuilt: ${rebuilt} | Invalidated: ${invalidated} | Total: ${total}`);
            console.log(`💾 RAM: ${ram} (Peak: ${peakRam}) | ⚡ CPU: ${cpu}%\n`);
        });
    }
}
