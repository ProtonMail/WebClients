import { parseAdditionalMetadata } from './parseAdditionalMetadata';

describe('parseClaimedAdditionalMetadata', () => {
    it('should return empty object when input is empty', () => {
        expect(parseAdditionalMetadata({})).toEqual({});
    });

    describe('Location', () => {
        it('should parse valid location', () => {
            const result = parseAdditionalMetadata({
                Location: { Latitude: 48.8566, Longitude: 2.3522 },
            });

            expect(result.location).toEqual({ latitude: 48.8566, longitude: 2.3522 });
        });

        it('should reject location with latitude out of range', () => {
            const result = parseAdditionalMetadata({
                Location: { Latitude: 91, Longitude: 2 },
            });

            expect(result.location).toBeUndefined();
        });

        it('should accept negative longitude', () => {
            const result = parseAdditionalMetadata({
                Location: { Latitude: 48, Longitude: -1 },
            });

            expect(result.location).toEqual({ latitude: 48, longitude: -1 });
        });

        it('should reject location with longitude below -180', () => {
            const result = parseAdditionalMetadata({
                Location: { Latitude: 48, Longitude: -181 },
            });

            expect(result.location).toBeUndefined();
        });

        it('should reject location with longitude over 180', () => {
            const result = parseAdditionalMetadata({
                Location: { Latitude: 48, Longitude: 181 },
            });

            expect(result.location).toBeUndefined();
        });

        it('should reject location when one coordinate is missing', () => {
            const result = parseAdditionalMetadata({
                Location: { Latitude: 48 },
            });

            expect(result.location).toBeUndefined();
        });

        it('should accept boundary values', () => {
            const result = parseAdditionalMetadata({
                Location: { Latitude: -90, Longitude: 0 },
            });

            expect(result.location).toEqual({ latitude: -90, longitude: 0 });
        });
    });

    describe('Camera', () => {
        it('should parse valid camera fields', () => {
            const result = parseAdditionalMetadata({
                Camera: {
                    CaptureTime: '2024-01-01T12:00:00Z',
                    Device: 'iPhone 15',
                    Orientation: 1,
                    SubjectCoordinates: { Top: 10, Left: 20, Bottom: 100, Right: 200 },
                },
            });

            expect(result.camera).toEqual({
                captureTime: '2024-01-01T12:00:00Z',
                device: 'iPhone 15',
                orientation: 1,
                subjectCoordinates: { top: 10, left: 20, bottom: 100, right: 200 },
            });
        });

        it('should reject orientation out of range [1-8]', () => {
            const result = parseAdditionalMetadata({ Camera: { Orientation: 9 } });

            expect(result.camera?.orientation).toBeUndefined();
        });

        it('should reject orientation of 0', () => {
            const result = parseAdditionalMetadata({ Camera: { Orientation: 0 } });

            expect(result.camera?.orientation).toBeUndefined();
        });

        it('should accept all valid orientation values', () => {
            for (let i = 1; i <= 8; i++) {
                const result = parseAdditionalMetadata({ Camera: { Orientation: i } });

                expect(result.camera?.orientation).toBe(i);
            }
        });

        it('should reject SubjectCoordinates when a field is missing', () => {
            const result = parseAdditionalMetadata({
                Camera: { SubjectCoordinates: { Top: 10, Left: 20, Bottom: 100 } },
            });

            expect(result.camera?.subjectCoordinates).toBeUndefined();
        });

        it('should reject SubjectCoordinates with non-integer values', () => {
            const result = parseAdditionalMetadata({
                Camera: { SubjectCoordinates: { Top: 10.5, Left: 20, Bottom: 100, Right: 200 } },
            });

            expect(result.camera?.subjectCoordinates).toBeUndefined();
        });
    });

    describe('Media', () => {
        it('should parse valid media fields', () => {
            const result = parseAdditionalMetadata({
                Media: { Width: 1920, Height: 1080, Duration: 60.5 },
            });

            expect(result.media).toEqual({ width: 1920, height: 1080, duration: 60.5 });
        });

        it('should reject non-integer Width', () => {
            const result = parseAdditionalMetadata({ Media: { Width: 1920.5 } });

            expect(result.media?.width).toBeUndefined();
        });

        it('should accept float Duration', () => {
            const result = parseAdditionalMetadata({ Media: { Duration: 1.5 } });

            expect(result.media?.duration).toBe(1.5);
        });

        it('should reject Infinity as Duration', () => {
            const result = parseAdditionalMetadata({ Media: { Duration: Infinity } });

            expect(result.media?.duration).toBeUndefined();
        });
    });

    describe('iOS.photos', () => {
        it('should parse valid iOS photos fields', () => {
            const result = parseAdditionalMetadata({
                'iOS.photos': { ICloudID: 'abc-123', ModificationTime: '2024-01-01T00:00:00Z' },
            });

            expect(result.iosPhotos).toEqual({
                iCloudId: 'abc-123',
                modificationTime: '2024-01-01T00:00:00Z',
            });
        });

        it('should ignore non-string ICloudID', () => {
            const result = parseAdditionalMetadata({ 'iOS.photos': { ICloudID: 42 } });

            expect(result.iosPhotos?.iCloudId).toBeUndefined();
        });
    });

    it('should parse all sections together', () => {
        const result = parseAdditionalMetadata({
            Location: { Latitude: 10, Longitude: 20 },
            Camera: { Device: 'Pixel 8' },
            Media: { Width: 4096, Height: 2160 },
            'iOS.photos': { ICloudID: 'xyz' },
        });

        expect(result.location?.latitude).toBe(10);
        expect(result.camera?.device).toBe('Pixel 8');
        expect(result.media?.width).toBe(4096);
        expect(result.iosPhotos?.iCloudId).toBe('xyz');
    });

    it('should return undefined section when all fields are invalid', () => {
        const result = parseAdditionalMetadata({ Camera: { Orientation: 99, Device: 123 } });

        expect(result.camera).toBeUndefined();
    });

    it('should ignore unknown top-level keys', () => {
        const result = parseAdditionalMetadata({ Unknown: { Foo: 'bar' } });

        expect(result).toEqual({});
    });
});
