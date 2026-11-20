import { semver } from '@proton/utils/semver';

import type { Logger } from '../utils/logger';
import type { LeaderLock } from './LeaderLock';
import type { TabChannel, TabMessage } from './TabChannel';

/**
 * Decides when this tab wants, keeps or gives up leadership among the content search tabs of a user. How the
 * lock is held is up to the {@link LeaderLock}.
 *
 * It runs from `start()` to `stop()`, and can be started again afterwards.
 *
 * Leadership ends up with the newest app version: tabs announce their version when they start, and answer a tab
 * that announces an older one, so it learns about theirs. A tab that knows a newer version is open steps down.
 */
export class LeaderElection {
    private leader = false;
    private running = false;
    /** counts the runs, so a lock granted to a run that has stopped since doesn't make the current one leader */
    private run = 0;
    /** whether this tab still wants to lead in this run: false once it stepped down */
    private candidate = false;
    private listeners: ((isLeader: boolean) => void)[] = [];
    /** the subscriptions of the current run */
    private unsubscribers: (() => void)[] = [];

    constructor(
        private readonly lock: LeaderLock,
        private readonly channel: TabChannel,
        private readonly appVersion: string,
        private readonly logger: Logger
    ) {}

    /** does nothing while running */
    start(): void {
        if (this.running) {
            return;
        }
        this.logger.info('joining the leader election');
        this.running = true;
        this.run++;
        this.candidate = true;
        this.unsubscribers.push(
            this.lock.onLost(() => {
                this.handleLoss();
            }),
            this.channel.subscribe((message) => {
                this.handleMessage(message);
            })
        );
        this.announceVersion();
        void this.campaign(this.run);
    }

    get isLeader(): boolean {
        return this.leader;
    }

    onLeadershipChanged(listener: (isLeader: boolean) => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((l) => {
                return l !== listener;
            });
        };
    }

    /** gives up leadership, or the place in line for it, until the election is stopped */
    stepDown(): void {
        if (this.candidate) {
            this.logger.info('stepping down from the leader election');
        }
        this.giveUp();
    }

    /** gives up leadership and stops taking part, until started again */
    stop(): void {
        if (!this.running) {
            return;
        }
        this.logger.info('leaving the leader election');
        this.running = false;
        this.run++;
        this.unsubscribers.splice(0).forEach((unsubscribe) => {
            unsubscribe();
        });
        this.giveUp();
    }

    private giveUp() {
        this.candidate = false;
        this.lock.release();
        this.setLeader(false);
    }

    private async campaign(run: number) {
        const acquired = await this.lock.acquire();
        if (!acquired || run !== this.run) {
            // released before it was granted, or granted to a run that was stopped since and released it
            return;
        }
        if (!this.candidate) {
            // stepped down while the lock was being granted
            this.lock.release();
            return;
        }
        this.setLeader(true);
    }

    private announceVersion() {
        this.channel.post({ type: 'version', version: this.appVersion });
    }

    private handleMessage(message: TabMessage) {
        if (message.type !== 'version') {
            return;
        }
        const theirs = semver(message.version);
        const ours = semver(this.appVersion);
        if (theirs > ours) {
            if (this.candidate) {
                this.logger.info(
                    `a tab of a newer app version is open: ${message.version}, this one is ${this.appVersion}`
                );
            }
            this.stepDown();
        } else if (theirs < ours) {
            this.announceVersion();
        }
    }

    private handleLoss() {
        if (!this.leader) {
            return;
        }
        this.logger.warn('lost the leader lock, asking for it again');
        this.setLeader(false);
        if (this.candidate) {
            this.lock.release();
            void this.campaign(this.run);
        }
    }

    private setLeader(isLeader: boolean) {
        if (this.leader === isLeader) {
            return;
        }
        this.leader = isLeader;
        this.logger.info(isLeader ? 'this tab is now the leader' : 'this tab is no longer the leader');
        this.listeners.forEach((listener) => {
            listener(isLeader);
        });
    }
}
