export class FrameReadiness {
    private frames = 0;
    private previous?: Uint8ClampedArray;
    private ready = false;

    status = 'Skipping initial camera frames';

    accept(pixels: Uint8ClampedArray): boolean {
        // Ignore the first 15 delivered frames before establishing a comparison baseline.
        if (++this.frames <= 15) {
            return false;
        }
        if (!this.previous) {
            this.previous = pixels;
            this.status = 'Waiting for differences between camera frames';
            return false;
        }
        if (!this.ready) {
            for (let index = 0; index < pixels.length; index += 64) {
                if (pixels[index] !== this.previous[index]) {
                    this.ready = true;
                    break;
                }
            }
            this.previous = pixels;
            if (this.ready) {
                this.status = 'Frame differences detected · gathering samples';
            }
            // The readiness pair is discarded; tests begin with the next frame pair.
            return false;
        }
        return true;
    }
}
