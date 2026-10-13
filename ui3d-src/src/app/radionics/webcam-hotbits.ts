import {extractFrameBytes, HotbitsProvider} from './hotbits-provider';

export class WebcamHotbits implements HotbitsProvider {
    readonly label = 'EXPERIMENTAL · webcam';
    private queue: number[] = [];
    private stream?: MediaStream;
    private timer?: ReturnType<typeof setInterval>;
    private generation = 0;
    private readonly video = document.createElement('video');

    get available(): number {return this.queue.length;}

    start(): Promise<void> {
        this.stop();
        const generation = this.generation;
        if (!navigator.mediaDevices?.getUserMedia) {
            return Promise.reject(new Error('Camera requires HTTPS or localhost and a supported browser.'));
        }
        return navigator.mediaDevices.getUserMedia({video: {width: 64, height: 64}, audio: false}).then(stream => {
            if (generation !== this.generation) {
                stream.getTracks().forEach(track => track.stop());
                throw new Error('Camera start cancelled.');
            }
            this.stream = stream;
            this.video.srcObject = stream;
            this.video.muted = true;
            this.video.playsInline = true;
            return this.video.play();
        }).then(() => {
            if (generation !== this.generation) {
                throw new Error('Camera start cancelled.');
            }
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 64;
            const context = canvas.getContext('2d', {willReadFrequently: true});
            if (!context) {
                throw new Error('Camera sampling canvas unavailable.');
            }
            let previous: Uint8ClampedArray | undefined;
            this.timer = setInterval(() => {
                if (this.video.readyState < 2 || document.hidden) {
                    return;
                }
                context.drawImage(this.video, 0, 0, 64, 64);
                const frame = context.getImageData(0, 0, 64, 64).data;
                if (previous && this.queue.length < 4096) {
                    this.queue.push(...extractFrameBytes(previous, frame).slice(0, 4096 - this.queue.length));
                }
                previous = frame;
            }, 100);
        }).catch(error => {
            if (generation === this.generation) {
                this.stop();
            }
            throw error;
        });
    }

    stop(): void {
        this.generation++;
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.stream?.getTracks().forEach(track => track.stop());
        this.stream = undefined;
        this.video.pause();
        this.video.srcObject = null;
        this.queue = [];
    }

    take(): number | undefined {return this.queue.shift();}
}
