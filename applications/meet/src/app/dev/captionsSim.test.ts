import { createCaptionsSim } from './captionsSim';
import type { CaptionsSimEvent, CaptionsSimSegment } from './captionsSimStore';
import { getCaptionsSimStatus, subscribeCaptionsSimEvents } from './captionsSimStore';

describe('createCaptionsSim', () => {
    const dispatch = vi.fn();
    let events: CaptionsSimEvent[];
    let unsubscribe: () => void;

    const segments = () =>
        events.flatMap((event) => (event.type === 'segment' ? [event.segment] : [])) as CaptionsSimSegment[];

    beforeEach(() => {
        vi.useFakeTimers();
        events = [];
        unsubscribe = subscribeCaptionsSimEvents((event) => events.push(event));
    });

    afterEach(() => {
        unsubscribe();
        vi.useRealTimers();
    });

    it('goes through loading before being ready', () => {
        const sim = createCaptionsSim(dispatch);

        sim.start(1000);
        expect(getCaptionsSimStatus()).toBe('loading');

        vi.advanceTimersByTime(1000);
        expect(getCaptionsSimStatus()).toBe('ready');

        sim.stop();
        expect(getCaptionsSimStatus()).toBe('off');
    });

    it('streams growing interim updates and finalises every segment', async () => {
        const sim = createCaptionsSim(dispatch);
        const text = 'This is the first sentence. And here is a second one that follows it.';

        const done = sim.say(text, { speaker: 'Alice' });
        expect(getCaptionsSimStatus()).toBe('ready');
        await vi.runAllTimersAsync();
        await done;

        const emitted = segments();
        const finals = emitted.filter((segment) => segment.isFinal);
        expect(finals.map((segment) => segment.text).join(' ')).toBe(text);

        for (const final of finals) {
            const interims = emitted.filter((segment) => segment.id === final.id && !segment.isFinal);
            expect(interims.length).toBeGreaterThan(0);
            interims.forEach((interim, index) => {
                expect(final.text.startsWith(interim.text)).toBe(true);
                if (index > 0) {
                    expect(interim.text.length).toBeGreaterThan(interims[index - 1].text.length);
                }
            });
        }

        expect(new Set(emitted.map((segment) => segment.speakerIdentity)).size).toBe(1);
        expect(dispatch).toHaveBeenCalled();

        sim.stop();
    });

    it('stops streaming once stopped', async () => {
        const sim = createCaptionsSim(dispatch);

        const done = sim.sayLong();
        await vi.advanceTimersByTimeAsync(2000);
        sim.stop();
        const emittedBeforeStop = segments().length;

        await vi.runAllTimersAsync();
        await done;

        expect(segments().length).toBe(emittedBeforeStop);
        expect(events[events.length - 1]).toEqual({ type: 'clear' });
        expect(getCaptionsSimStatus()).toBe('off');
    });
});
