/**
 * cr3 - Canon CR3 thumbnail extractor
 * 
 * Based on format information from https://github.com/lclevy/canon_cr3
 */
 #include <stdio.h>
 #include <string.h>
 #include <stdint.h>
 #include <ctype.h>
 
 #include <emscripten.h>
 
 #ifndef DEBUG
 #define DEBUG 0
 #endif
 
 #define BUFFER_SIZE 4096
 
 typedef struct {
     uint32_t size;
     char type[5];  // 4 chars + null terminator
     uint64_t large_size;  // For boxes with size==1
 } BoxHeader;
 
 typedef struct {
     uint32_t jpeg_size;
 } ThmbData;
 
 typedef struct {
     uint32_t jpeg_size;
 } PrvwData;
 
 uint32_t read_uint32_be(const unsigned char *buffer) {
     return ((uint32_t)buffer[0] << 24) |
            ((uint32_t)buffer[1] << 16) |
            ((uint32_t)buffer[2] << 8) |
            (uint32_t)buffer[3];
 }
 
 uint64_t read_uint64_be(const unsigned char *buffer) {
     return ((uint64_t)buffer[0] << 56) |
            ((uint64_t)buffer[1] << 48) |
            ((uint64_t)buffer[2] << 40) |
            ((uint64_t)buffer[3] << 32) |
            ((uint64_t)buffer[4] << 24) |
            ((uint64_t)buffer[5] << 16) |
            ((uint64_t)buffer[6] << 8) |
            (uint64_t)buffer[7];
 }
 
 uint16_t read_uint16_be(const unsigned char *buffer) {
     return ((uint16_t)buffer[0] << 8) |
            (uint16_t)buffer[1];
 }
 
 void print_hex_buffer(const unsigned char *buffer, int size) {
     if (!DEBUG) return;
     
     printf("Hex buffer [%d bytes]: ", size);
     for (int i = 0; i < size && i < 32; i++) {
         printf("%02x ", buffer[i]);
     }
     printf("\n");
 }
 
 void print_ascii_buffer(const unsigned char *buffer, int size) {
     if (!DEBUG) return;
     
     printf("ASCII buffer: ");
     for (int i = 0; i < size && i < 32; i++) {
         if (isprint(buffer[i])) {
             printf("%c", buffer[i]);
         } else {
             printf(".");
         }
     }
     printf("\n");
 }
 
 int read_box_header(FILE *fp, BoxHeader *header) {
     unsigned char buffer[16];
     
     if (fread(buffer, 1, 8, fp) != 8) {
         if (DEBUG) printf("Failed to read box header\n");
         return 0;
     }
     
     header->size = read_uint32_be(buffer);
     memcpy(header->type, buffer + 4, 4);
     header->type[4] = '\0';
     
     if (header->size == 1) {
         if (fread(buffer, 1, 8, fp) != 8) {
             if (DEBUG) printf("Failed to read extended box header size\n");
             return 0;
         }
         header->large_size = read_uint64_be(buffer);
     } else {
         header->large_size = header->size;
     }
     
     if (DEBUG) {
         printf("Box header: type='%s', size=%u (0x%x)\n", 
                header->type, (unsigned int)header->large_size, (unsigned int)header->large_size);
     }
     
     return 1;
 }
 
 int read_thmb_data(FILE *fp, ThmbData *thmb_data) {
     unsigned char buffer[24];
     
     if (fread(buffer, 1, 16, fp) != 16) {
         if (DEBUG) printf("Failed to read THMB header\n");
         return 0;
     }
     
     if (DEBUG) print_hex_buffer(buffer, 16);
     
     uint8_t version = buffer[0];
     
     if (DEBUG) printf("THMB version = %u\n", version);
     
     if (version <= 1) {  // Version 0 or 1
         thmb_data->jpeg_size = read_uint32_be(buffer + 8);
         
         if (DEBUG) printf("THMB JPEG size: %u\n", thmb_data->jpeg_size);
         return 1;
     } else {
         if (DEBUG) printf("Unknown THMB version: %d\n", version);
         
         uint32_t possible_size = read_uint32_be(buffer + 8);
         
         if (DEBUG) {
             printf("Possible JPEG size: %u\n", possible_size);
             
             if (possible_size > 1000 && possible_size < 1000000) {
                 printf("These values look reasonable for a thumbnail\n");
                 thmb_data->jpeg_size = possible_size;
                 return 1;
             }
         }
         
         return 0;
     }
 }
 
 int read_prvw_data(FILE *fp, PrvwData *prvw_data) {
     unsigned char buffer[32];
     long start_pos = ftell(fp);
     
     if (fread(buffer, 1, 24, fp) != 24) {
         if (DEBUG) printf("Failed to read PRVW header\n");
         return 0;
     }
     
     if (DEBUG) {
         printf("PRVW header at offset 0x%lx\n", start_pos);
         print_hex_buffer(buffer, 24);
         print_ascii_buffer(buffer, 24);
     }
     
     uint32_t size1 = read_uint32_be(buffer + 20);
     uint32_t size2 = read_uint32_be(buffer + 16);
     
     if (DEBUG) {
         printf("PRVW possible size (1): %u\n", size1);
         printf("PRVW possible size (2): %u\n", size2);
     }
     
     if (size1 > 1000 && size1 < 5000000) {
         prvw_data->jpeg_size = size1;
         if (DEBUG) printf("Using size (1)\n");
         return 1;
     } else if (size2 > 1000 && size2 < 5000000) {
         prvw_data->jpeg_size = size2;
         if (DEBUG) printf("Using size (2)\n");
         return 1;
     }
     
     // Try alternate offsets in case the structure is different
     // Last resort option
     fseek(fp, start_pos, SEEK_SET);
     if (fread(buffer, 1, 32, fp) != 32) {
         if (DEBUG) printf("Failed to read extended PRVW header\n");
         return 0;
     }
     
     for (int offset = 8; offset < 24; offset += 2) {
         uint32_t test_size = read_uint32_be(buffer + offset + 4);
         
         if (test_size > 1000 && test_size < 5000000) {
             if (DEBUG) printf("Found potential PRVW size at offset +%d: %u\n", offset, test_size);
             prvw_data->jpeg_size = test_size;
             return 1;
         }
     }
     
     if (DEBUG) printf("Could not determine PRVW size\n");
     return 0;
 }
 
 int extract_jpeg(FILE *fp, FILE *out_fp, uint32_t jpeg_size) {
     unsigned char buffer[BUFFER_SIZE];
     uint32_t bytes_left = jpeg_size;
     size_t bytes_read;
     long start_pos = ftell(fp);
     
     if (DEBUG) {
         if (bytes_left >= 4) {
             fread(buffer, 1, 4, fp);
             print_hex_buffer(buffer, 4);
             if (buffer[0] == 0xFF && buffer[1] == 0xD8) {
                 printf("JPEG header verified at offset 0x%lx\n", start_pos);
             } else {
                 printf("WARNING - No JPEG header at offset 0x%lx\n", start_pos);
             }
             fseek(fp, start_pos, SEEK_SET);
         }
     }
     
     while (bytes_left > 0) {
         bytes_read = fread(buffer, 1, bytes_left > BUFFER_SIZE ? BUFFER_SIZE : bytes_left, fp);
         if (bytes_read == 0) {
             if (DEBUG) printf("Failed to read JPEG data, %u bytes remaining\n", bytes_left);
             return 0;
         }
         
         if (fwrite(buffer, 1, bytes_read, out_fp) != bytes_read) {
             if (DEBUG) printf("Failed to write JPEG data to output file\n");
             return 0;
         }
         
         bytes_left -= bytes_read;
     }
     
     if (DEBUG) printf("Successfully extracted %u bytes of JPEG data\n", jpeg_size);
     
     return 1;
 }
 
 int compare_uuid(const unsigned char *uuid1, const unsigned char *uuid2) {
     return memcmp(uuid1, uuid2, 16) == 0;
 }
 
 // That's the struct for the results sent back to the JavaScript
 typedef struct {
     int success;
     int found_thumbnail;
     uint32_t thumb_size;
     int found_preview;
     uint32_t preview_size;
     char error_message[256];
 } ExtractResult;
 
 ExtractResult result;
 
 const unsigned char PREVIEW_UUID[16] = {
     0xea, 0xf4, 0x2b, 0x5e, 0x1c, 0x98, 0x4b, 0x88, 
     0xb9, 0xfb, 0xb7, 0xdc, 0x40, 0x6e, 0x4d, 0x16
 };
 
 int extract_preview_from_uuid(FILE *fp, uint64_t start_offset, uint64_t end_offset, const char *preview_file) {
     unsigned char buffer[BUFFER_SIZE];
     long pos = ftell(fp);
     int jpeg_offset = -1;
     uint32_t jpeg_size = 0;
 
     fseek(fp, start_offset, SEEK_SET);
     
     for (uint64_t offset = 0; offset < (end_offset - start_offset); offset++) {
         if (fread(buffer, 1, 1, fp) != 1) break;
         if (buffer[0] != 0xFF) continue;
         
         if (fread(buffer + 1, 1, 1, fp) != 1) break;
         if (buffer[1] == 0xD8) {  // JPEG start marker found
             jpeg_offset = offset;
             if (DEBUG) printf("Found JPEG signature at offset 0x%llx\n", 
                              (unsigned long long)(start_offset + offset));
             break;
         }
         
         offset++;
         fseek(fp, start_offset + offset, SEEK_SET);
     }
 
     if (jpeg_offset == -1) {
         fseek(fp, pos, SEEK_SET);
         return 0;
     }
 
     jpeg_size = end_offset - (start_offset + jpeg_offset);
     
     fseek(fp, start_offset + jpeg_offset, SEEK_SET);
     FILE *out_fp = fopen(preview_file, "wb");
     if (!out_fp) {
         if (DEBUG) printf("Failed to create preview file\n");
         fseek(fp, pos, SEEK_SET);
         return 0;
     }
 
     unsigned char jpeg_buffer[BUFFER_SIZE];
     uint32_t remaining = jpeg_size;
     while (remaining > 0) {
         size_t read = fread(jpeg_buffer, 1, (remaining > BUFFER_SIZE) ? BUFFER_SIZE : remaining, fp);
         if (read == 0) break;
         fwrite(jpeg_buffer, 1, read, out_fp);
         remaining -= read;
     }
 
     fclose(out_fp);
     fseek(fp, pos, SEEK_SET);
     return 1;
 }
 
 int process_box(FILE *fp, uint64_t end_offset, const char *thumb_file, const char *preview_file, int depth) {
     BoxHeader header;
     uint64_t current_offset, next_offset;
     unsigned char uuid[16];
     char indent[32] = "";
     
     if (DEBUG) {
         for (int i = 0; i < depth && i < 15; i++) {
             strcat(indent, "  ");
         }
     }
     
     current_offset = ftell(fp);
     if (current_offset == -1) {
         if (DEBUG) printf("%sFailed to get current file position\n", indent);
         return 0;
     }
     
     if (DEBUG) {
         printf("%sProcessing boxes at offset 0x%llx to 0x%llx (depth %d)\n", 
                indent, (unsigned long long)current_offset, (unsigned long long)end_offset, depth);
     }
     
     while (current_offset < end_offset) {
         if (!read_box_header(fp, &header)) {
             if (DEBUG) printf("%sFailed to read box header at offset 0x%llx\n", 
                              indent, (unsigned long long)current_offset);
             return 0;
         }
         
         if (header.size == 0) {
             next_offset = end_offset;
         } else if (header.size == 1) {
             next_offset = current_offset + header.large_size;
         } else {
             next_offset = current_offset + header.size;
         }
         
         if (DEBUG) {
             printf("%sFound box '%s' at offset 0x%llx, size=%llu, next=0x%llx\n", 
                    indent, header.type, 
                    (unsigned long long)current_offset, 
                    (unsigned long long)(header.large_size), 
                    (unsigned long long)next_offset);
         }
         
         if (strcmp(header.type, "THMB") == 0) {
             if (DEBUG) printf("%sProcessing THMB box at offset 0x%llx\n", 
                              indent, (unsigned long long)ftell(fp));
                     
             ThmbData thmb_data;
             
             if (!read_thmb_data(fp, &thmb_data)) {
                 snprintf(result.error_message, sizeof(result.error_message), 
                         "Failed to read THMB data");
                 if (DEBUG) printf("%sFailed to read THMB data\n", indent);
                 return 0;
             }
             
             result.found_thumbnail = 1;
             result.thumb_size = thmb_data.jpeg_size;
             
             FILE *out_fp = fopen(thumb_file, "wb");
             if (!out_fp) {
                 snprintf(result.error_message, sizeof(result.error_message), 
                         "Failed to open thumbnail output file: %s", thumb_file);
                 if (DEBUG) printf("%sFailed to open thumbnail output file\n", indent);
                 return 0;
             }
             
             if (!extract_jpeg(fp, out_fp, thmb_data.jpeg_size)) {
                 snprintf(result.error_message, sizeof(result.error_message), 
                         "Failed to extract thumbnail JPEG data");
                 fclose(out_fp);
                 if (DEBUG) printf("%sFailed to extract thumbnail JPEG data\n", indent);
                 return 0;
             }
             
             fclose(out_fp);
             if (DEBUG) printf("%sThumbnail extracted to: %s\n", indent, thumb_file);
             
             fseek(fp, next_offset, SEEK_SET);
         } else if (strcmp(header.type, "PRVW") == 0) {
             if (DEBUG) printf("%sProcessing PRVW box at offset 0x%llx\n", 
                              indent, (unsigned long long)ftell(fp));
                     
             PrvwData prvw_data;
             
             if (!read_prvw_data(fp, &prvw_data)) {
                 snprintf(result.error_message, sizeof(result.error_message), 
                         "Failed to read PRVW data");
                 if (DEBUG) printf("%sFailed to read PRVW data\n", indent);
                 return 0;
             }
             
             if (DEBUG) printf("%sFound preview: JPEG size: %u bytes\n", 
                              indent, prvw_data.jpeg_size);
             
             result.found_preview = 1;
             result.preview_size = prvw_data.jpeg_size;
             
             FILE *out_fp = fopen(preview_file, "wb");
             if (!out_fp) {
                 snprintf(result.error_message, sizeof(result.error_message), 
                         "Failed to open preview output file: %s", preview_file);
                 if (DEBUG) printf("%sFailed to open preview output file\n", indent);
                 return 0;
             }
             
             if (!extract_jpeg(fp, out_fp, prvw_data.jpeg_size)) {
                 snprintf(result.error_message, sizeof(result.error_message), 
                         "Failed to extract preview JPEG data");
                 fclose(out_fp);
                 if (DEBUG) printf("%sFailed to extract preview JPEG data\n", indent);
                 return 0;
             }
             
             fclose(out_fp);
             if (DEBUG) printf("%sPreview extracted to: %s\n", indent, preview_file);
             
             fseek(fp, next_offset, SEEK_SET);
         } else if (strcmp(header.type, "uuid") == 0) {
             if (fread(uuid, 1, 16, fp) != 16) {
                 snprintf(result.error_message, sizeof(result.error_message), 
                         "Failed to read UUID");
                 return 0;
             }
         
             if (compare_uuid(uuid, PREVIEW_UUID)) {
                 if (DEBUG) printf("Found preview UUID\n");
                 uint64_t uuid_start = ftell(fp);
                 uint64_t uuid_end = next_offset;
         
                 if (extract_preview_from_uuid(fp, uuid_start, uuid_end, preview_file)) {
                     result.found_preview = 1;
                     result.preview_size = uuid_end - uuid_start;
                 }
         
                 fseek(fp, next_offset, SEEK_SET);
             } else {
                 fseek(fp, next_offset, SEEK_SET);
             }
         } else if (strcmp(header.type, "moov") == 0 || 
                   strcmp(header.type, "trak") == 0 || 
                   strcmp(header.type, "mdia") == 0 || 
                   strcmp(header.type, "minf") == 0 || 
                   strcmp(header.type, "dinf") == 0 || 
                   strcmp(header.type, "stbl") == 0) {
             if (DEBUG) printf("%sProcessing container box '%s' children\n", indent, header.type);
             
             if (!process_box(fp, next_offset, thumb_file, preview_file, depth + 1)) {
                 if (DEBUG) printf("%sWARNING: Failed to process container '%s' children\n", indent, header.type);
             }
             fseek(fp, next_offset, SEEK_SET);
         } else {
             if (DEBUG) printf("%sSkipping box '%s' at offset 0x%llx\n", 
                              indent, header.type, (unsigned long long)current_offset);
             fseek(fp, next_offset, SEEK_SET);
         }
         
         current_offset = ftell(fp);
         if (current_offset == -1) {
             if (DEBUG) printf("%sFailed to get file position after processing box\n", indent);
             return 0;
         }
     }
     
     return 1;
 }
 
 EMSCRIPTEN_KEEPALIVE
 const char* extract_cr3_images(const char* input_file, const char* thumb_file, const char* preview_file) {
     static char result_json[512];
     FILE *fp;
     
     result.success = 0;
     result.found_thumbnail = 0;
     result.thumb_size = 0;
     result.found_preview = 0;
     result.preview_size = 0;
     result.error_message[0] = '\0';
     
     if (DEBUG) {
         printf("Starting extraction from file: %s\n", input_file);
         printf("Thumbnail output: %s\n", thumb_file);
         printf("Preview output: %s\n", preview_file);
     }
     
     fp = fopen(input_file, "rb");
     if (!fp) {
         snprintf(result.error_message, sizeof(result.error_message), 
                 "Failed to open input file: %s", input_file);
         if (DEBUG) printf("Failed to open input file\n");
         goto generate_json;
     }
     
     unsigned char buffer[16];
     if (fread(buffer, 1, 16, fp) != 16) {
         snprintf(result.error_message, sizeof(result.error_message), 
                 "Failed to read file header");
         if (DEBUG) printf("Failed to read file header\n");
         fclose(fp);
         goto generate_json;
     }
     
     if (DEBUG) {
         printf("File header: ");
         print_hex_buffer(buffer, 16);
         print_ascii_buffer(buffer, 16);
     }
     
     fseek(fp, 0, SEEK_SET);
     
     // Check file signature: should be "ftypcrx " or "ftypheix"
     if (memcmp(buffer + 4, "ftypcrx ", 8) != 0 && memcmp(buffer + 4, "ftypheix", 8) != 0) {
         snprintf(result.error_message, sizeof(result.error_message), 
                 "Not a Canon CR3 file (header doesn't match)");
         if (DEBUG) printf("Not a Canon CR3 file - header is not ftypcrx or ftypheix\n");
         fclose(fp);
         goto generate_json;
     }
     
     fseek(fp, 0, SEEK_END);
     uint64_t file_size = ftell(fp);
     fseek(fp, 0, SEEK_SET);
     
     if (DEBUG) printf("File size: %llu bytes\n", (unsigned long long)file_size);
     
     if (!process_box(fp, file_size, thumb_file, preview_file, 0)) {
         if (result.error_message[0] == '\0') {
             snprintf(result.error_message, sizeof(result.error_message), 
                     "Error processing file");
         }
         if (DEBUG) printf("Error during file processing\n");
     }
     
     fclose(fp);
     
     if (!result.found_thumbnail && !result.found_preview) {
         snprintf(result.error_message, sizeof(result.error_message), 
                 "No thumbnail or preview found in the file");
         if (DEBUG) printf("No thumbnail or preview found\n");
         goto generate_json;
     }
     
     result.success = 1;
     
 generate_json:
     snprintf(result_json, sizeof(result_json), 
             "{\"success\":%d,\"foundThumbnail\":%d,\"thumbSize\":%d,"
             "\"foundPreview\":%d,\"previewSize\":%d,\"error\":\"%s\"}",
             result.success, 
             result.found_thumbnail, result.thumb_size,
             result.found_preview, result.preview_size,
             result.error_message);
     
     return result_json;
 }