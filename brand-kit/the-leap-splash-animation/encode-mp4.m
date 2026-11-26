// Encodes a folder of numbered PNG frames (frame-0000.png, ...) into an
// H.264 MP4 using macOS's own AVFoundation, so no ffmpeg is needed.
// build.mjs compiles and runs it:  encode-mp4 <frames-dir> <fps> <out.mp4>
//
// Objective-C rather than Swift: it compiles with plain clang, which keeps
// working on Macs whose Command Line Tools ship broken Swift module maps.

#import <AVFoundation/AVFoundation.h>
#import <CoreGraphics/CoreGraphics.h>
#import <ImageIO/ImageIO.h>

static CGImageRef LoadImage(NSURL *url) {
  CGImageSourceRef src = CGImageSourceCreateWithURL((__bridge CFURLRef)url, NULL);
  if (!src) return NULL;
  CGImageRef img = CGImageSourceCreateImageAtIndex(src, 0, NULL);
  CFRelease(src);
  return img;
}

static int Fail(NSString *message) {
  fprintf(stderr, "encode-mp4: %s\n", message.UTF8String);
  return 1;
}

int main(int argc, const char *argv[]) {
  @autoreleasepool {
    if (argc != 4) return Fail(@"usage: encode-mp4 <frames-dir> <fps> <out.mp4>");
    NSURL *framesDir = [NSURL fileURLWithPath:@(argv[1])];
    int32_t fps = (int32_t)atoi(argv[2]);
    NSURL *outURL = [NSURL fileURLWithPath:@(argv[3])];

    NSArray<NSURL *> *all = [NSFileManager.defaultManager
        contentsOfDirectoryAtURL:framesDir includingPropertiesForKeys:nil options:0 error:nil];
    NSArray<NSURL *> *frames = [[all filteredArrayUsingPredicate:
        [NSPredicate predicateWithFormat:@"pathExtension == 'png'"]]
        sortedArrayUsingComparator:^NSComparisonResult(NSURL *a, NSURL *b) {
          return [a.lastPathComponent compare:b.lastPathComponent];
        }];
    if (frames.count == 0) return Fail(@"no PNG frames found");

    CGImageRef first = LoadImage(frames[0]);
    if (!first) return Fail(@"can't read the first frame");
    size_t width = CGImageGetWidth(first);
    size_t height = CGImageGetHeight(first);
    CGImageRelease(first);

    [NSFileManager.defaultManager removeItemAtURL:outURL error:nil];
    NSError *error = nil;
    AVAssetWriter *writer = [AVAssetWriter assetWriterWithURL:outURL
                                                     fileType:AVFileTypeMPEG4
                                                        error:&error];
    if (!writer) return Fail(error.localizedDescription);

    AVAssetWriterInput *input = [AVAssetWriterInput
        assetWriterInputWithMediaType:AVMediaTypeVideo
                       outputSettings:@{
                         AVVideoCodecKey : AVVideoCodecTypeH264,
                         AVVideoWidthKey : @(width),
                         AVVideoHeightKey : @(height),
                         AVVideoCompressionPropertiesKey : @{
                           // Generous, so the soft gradient doesn't band.
                           AVVideoAverageBitRateKey : @10000000,
                           AVVideoProfileLevelKey : AVVideoProfileLevelH264HighAutoLevel,
                           AVVideoMaxKeyFrameIntervalKey : @(fps),
                         },
                         AVVideoColorPropertiesKey : @{
                           AVVideoColorPrimariesKey : AVVideoColorPrimaries_ITU_R_709_2,
                           AVVideoTransferFunctionKey : AVVideoTransferFunction_ITU_R_709_2,
                           AVVideoYCbCrMatrixKey : AVVideoYCbCrMatrix_ITU_R_709_2,
                         },
                       }];
    input.expectsMediaDataInRealTime = NO;
    AVAssetWriterInputPixelBufferAdaptor *adaptor = [AVAssetWriterInputPixelBufferAdaptor
        assetWriterInputPixelBufferAdaptorWithAssetWriterInput:input
                                   sourcePixelBufferAttributes:@{
                                     (id)kCVPixelBufferPixelFormatTypeKey : @(kCVPixelFormatType_32BGRA),
                                     (id)kCVPixelBufferWidthKey : @(width),
                                     (id)kCVPixelBufferHeightKey : @(height),
                                   }];
    [writer addInput:input];
    if (![writer startWriting]) return Fail(writer.error.localizedDescription);
    [writer startSessionAtSourceTime:kCMTimeZero];

    // The frames' sRGB values go into the video unchanged, as ffmpeg does.
    // Phones, browsers and social apps show BT.709 video close to sRGB, so
    // the orange plays back as the brand orange. (macOS QuickTime alone
    // shows it a touch lighter: its well-known BT.709 gamma quirk. Converting
    // to a BT.709 colour space to suit QuickTime over-saturates it elsewhere.)
    CGColorSpaceRef videoSpace = CGColorSpaceCreateWithName(kCGColorSpaceSRGB);
    for (NSUInteger i = 0; i < frames.count; i++) {
      @autoreleasepool {
        while (!input.readyForMoreMediaData) usleep(1000);
        CVPixelBufferRef pb = NULL;
        CVPixelBufferPoolCreatePixelBuffer(NULL, adaptor.pixelBufferPool, &pb);
        if (!pb) return Fail(@"couldn't allocate a pixel buffer");
        CGImageRef img = LoadImage(frames[i]);
        if (!img) return Fail([NSString stringWithFormat:@"can't read %@", frames[i].path]);

        CVPixelBufferLockBaseAddress(pb, 0);
        CGContextRef ctx = CGBitmapContextCreate(
            CVPixelBufferGetBaseAddress(pb), width, height, 8,
            CVPixelBufferGetBytesPerRow(pb), videoSpace,
            kCGImageAlphaPremultipliedFirst | kCGBitmapByteOrder32Little);
        CGContextDrawImage(ctx, CGRectMake(0, 0, width, height), img);
        CGContextRelease(ctx);
        CVPixelBufferUnlockBaseAddress(pb, 0);
        CGImageRelease(img);

        if (![adaptor appendPixelBuffer:pb withPresentationTime:CMTimeMake((int64_t)i, fps)]) {
          CVPixelBufferRelease(pb);
          return Fail(writer.error.localizedDescription ?: @"append failed");
        }
        CVPixelBufferRelease(pb);
      }
    }
    CGColorSpaceRelease(videoSpace);

    [input markAsFinished];
    dispatch_semaphore_t done = dispatch_semaphore_create(0);
    [writer finishWritingWithCompletionHandler:^{ dispatch_semaphore_signal(done); }];
    dispatch_semaphore_wait(done, DISPATCH_TIME_FOREVER);
    if (writer.status != AVAssetWriterStatusCompleted)
      return Fail(writer.error.localizedDescription ?: @"writing failed");

    printf("%s: %zux%zu, %lu frames at %d fps\n", outURL.lastPathComponent.UTF8String,
           width, height, (unsigned long)frames.count, fps);
  }
  return 0;
}
