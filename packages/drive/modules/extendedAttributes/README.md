# Extended Attributes Module

Extended attributes generation for Proton Drive. Handles EXIF parsing, metadata building, and photo tag detection for file uploads.

## Quick Start

```typescript
import {
    generateExtendedAttributes,
    generatePhotosExtendedAttributes
} from '@proton/drive/modules/extendedAttributes';

// For regular Drive uploads
const { metadata } = generateExtendedAttributes(file, mimeType, mediaInfo);

// For Photos uploads (includes tags and capture time)
const { metadata, tags, captureTime } = generatePhotosExtendedAttributes(file, mimeType, mediaInfo);
```

## API

### generateExtendedAttributes(file, mimeType, mediaInfo?)

**Usage:**

```typescript
const { metadata } = await generateExtendedAttributes(file, mimeType, {
    width: 1920,
    height: 1080,
    duration: 120,
});

// metadata contains: Media, Location, Camera
```

### generatePhotosExtendedAttributes(file, mimeType, mediaInfo?)

**Usage:**

```typescript
const { metadata, tags, captureTime } = await generatePhotosExtendedAttributes(file, mimeType, mediaInfo);

// metadata: Extended attributes (Media, Location, Camera)
// tags: Photo tags (Raw, Videos, Screenshots, Panoramas, etc.)
// captureTime: Photo capture date/time
```

## Types

### ExtendedAttributesMetadata

```typescript
interface ExtendedAttributesMetadata {
    Media?: {
        Width?: number;
        Height?: number;
        Duration?: number;
    };
    Location?: {
        Latitude: number;
        Longitude: number;
    };
    Camera?: {
        CaptureTime?: string;
        Device?: string;
        Orientation?: number;
        SubjectCoordinates?: {
            Top: number;
            Left: number;
            Bottom: number;
            Right: number;
        };
    };
}
```

### PhotoTag

Supported photo tags:

- `PhotoTag.Raw` - RAW photo format
- `PhotoTag.Videos` - Video file
- `PhotoTag.Screenshots` - Screenshot image
- `PhotoTag.Panoramas` - Panoramic photo
- `PhotoTag.MotionPhotos` - Motion photo (Live Photo)
- `PhotoTag.Portraits` - Portrait mode photo
- `PhotoTag.Selfies` - Selfie photo

## Architecture

The module follows a functional architecture pattern similar to the thumbnails module:

```
extendedAttributes/
├── index.ts                              # Public API exports
├── types.ts                              # TypeScript interfaces
├── extendedAttributesGenerator.ts        # Regular Drive uploads
├── photosExtendedAttributesGenerator.ts  # Photos uploads
├── exifParser/
│   ├── exifParser.ts                     # EXIF extraction
│   ├── exifUtils.ts                      # EXIF utilities
│   ├── formatExifDateTime.ts             # Date formatting
│   ├── appleMakerNote.ts                 # Apple-specific parsing
│   └── convertSubjectAreaToSubjectCoordinates.ts
├── metadataBuilder/
│   └── metadataBuilder.ts                # Build metadata from EXIF
└── tagDetector/
    └── tagDetector.ts                    # Detect photo tags
```
