import {AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, computed, inject, isDevMode, signal} from '@angular/core';
import {DeviceLoader, LoadedDevice, disposeObject} from '../core/device-loader';
import {DeviceState} from '../core/device-state';
import {EventBus} from '../core/event-bus';
import {Persistence, applyPreset, createPreset, presetScope} from '../core/persistence';
import {SceneController} from '../three/scene-controller';
import {WebcamHotbits} from '../radionics/webcam-hotbits';
import {State} from '../models/device.types';

interface Instance {loaded: LoadedDevice; store: DeviceState; scene: SceneController; host: HTMLElement; unsubscribe: () => void;}

@Component({
    selector: 'app-root',
    standalone: true,
    templateUrl: './workspace.component.html'
})
export class WorkspaceComponent implements AfterViewInit, OnDestroy {
    @ViewChild('viewport', {static: true}) viewport!: ElementRef<HTMLElement>;
    private readonly zone = inject(NgZone);
    private readonly loader = new DeviceLoader();
    private readonly bus = new EventBus();
    private readonly persistence = new Persistence();
    private readonly webcam = new WebcamHotbits();
    private readonly instances: Instance[] = [];
    private active?: Instance;
    private stopped = false;
    private statusTimer?: ReturnType<typeof setInterval>;
    private cryptoSample = 0;
    private lastSampleTime = 0;
    readonly state = signal<Readonly<State>>({});
    readonly title = signal('Loading device…');
    readonly notice = signal('');
    readonly diagnostics = signal<string[]>([]);
    readonly controls = signal<DeviceState['controls']>(new Map());
    readonly instanceIds = signal<string[]>([]);
    readonly activeId = signal('');
    readonly mode = signal<'snapshot' | 'live'>('snapshot');
    readonly busy = signal(false);
    readonly maximized = signal(false);
    readonly fullscreen = signal(false);
    readonly webcamActive = signal(false);
    readonly buffered = signal(0);
    readonly signatureChanged = signal(false);
    readonly pwaStatus = signal(isDevMode() ? 'Development preview · offline cache disabled' : 'Installing offline app…');
    readonly stateJson = computed(() => JSON.stringify(this.state(), null, 2));

    ngAfterViewInit(): void {
        document.addEventListener('fullscreenchange', this.fullscreenChange);
        this.loadDemo();
        if (!isDevMode() && 'serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                if (!this.stopped) {
                    this.pwaStatus.set(new URL(registration.scope).pathname === '/ui3d/'
                        ? 'Offline app ready · /ui3d/ scope' : 'Another worker controls this visit; see README installation guidance.');
                }
            }).catch(error => this.report(error));
        }
        this.zone.runOutsideAngular(() => {
            this.statusTimer = setInterval(() => {
                this.buffered.set(this.webcam.available);
                this.instances.forEach(instance => {
                    if (Object.hasOwn(instance.store.state, 'hotbits')) {
                        instance.store.set('hotbits', this.webcam.available);
                    }
                });
            }, 1000);
        });
    }

    loadDemo(add = false, procedural = false): void {
        if (this.busy() || (add && this.instances.length >= 2)) {
            return;
        }
        this.busy.set(true);
        this.loader.demo(procedural).then(loaded => this.activate(loaded, add))
            .catch(error => this.report(error)).finally(() => this.busy.set(false));
    }

    selectInstance(id: string): void {
        const instance = this.instances.find(item => item.store.instanceId === id);
        if (instance) {
            this.active = instance;
            this.instances.forEach(item => item.host.hidden = item !== instance);
            this.refresh();
        }
    }

    importDevice(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.importFiles(Array.from(input.files ?? []));
        input.value = '';
    }

    drop(event: DragEvent): void {
        event.preventDefault();
        this.importFiles(Array.from(event.dataTransfer?.files ?? []));
    }

    adjust(key: string, event: Event): void {
        this.active?.store.set(key, Number((event.target as HTMLInputElement).value));
    }

    toggle(key: string): void {
        this.active?.store.set(key, !this.active.store.state[key]);
    }

    press(key: string): void {
        const control = this.active?.store.controls.get(key);
        if (control?.mode === 'toggle') {
            this.toggle(key);
        } else if (control) {
            this.active?.store.action(control.action ?? `${key}.toggle`);
            this.active?.store.action(control.action ?? `${key}.toggle`, false);
        }
    }

    controlEntries(): [string, import('../models/device.types').Control][] {
        return [...this.controls()];
    }

    camera(manual: boolean): void {this.active?.scene.setCamera(manual);}

    changeMode(event: Event): void {
        this.active?.store.setMode((event.target as HTMLSelectElement).value as 'snapshot' | 'live');
        this.refresh();
    }

    reset(): void {
        this.active?.store.reset();
        this.notice.set('Defaults restored.');
    }

    save(): void {
        if (this.active) {
            this.persistence.save(createPreset(this.active.store, this.active.loaded.contentHash))
                .then(() => this.notice.set('Preset saved locally.')).catch(error => this.report(error));
        }
    }

    load(): void {
        const instance = this.active;
        if (instance) {
            this.persistence.load(presetScope(instance.store, instance.loaded.contentHash)).then(preset => {
                applyPreset(instance.store, preset, instance.loaded.contentHash);
                this.notice.set('Preset loaded into selected instance.');
            }).catch(error => this.report(error));
        }
    }

    exportPreset(): void {
        if (!this.active) {
            return;
        }
        const blob = new Blob([JSON.stringify(createPreset(this.active.store, this.active.loaded.contentHash), null, 4)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${this.active.store.definition.device.id}-preset.json`;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    importPreset(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        const instance = this.active;
        input.value = '';
        if (!file || !instance) {
            return;
        }
        if (file.size > 1024 * 1024) {
            this.report('Preset exceeds 1 MB.');
            return;
        }
        file.text().then(text => {
            applyPreset(instance.store, JSON.parse(text), instance.loaded.contentHash);
            this.notice.set('Preset imported.');
        }).catch(error => this.report(error));
    }

    toggleFullscreen(): void {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(error => this.report(error));
        } else if (document.fullscreenEnabled && document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => this.maximizeFallback());
        } else {
            this.maximizeFallback();
        }
    }

    startWebcam(): void {
        this.webcam.start().then(() => {
            this.webcamActive.set(true);
            this.instances.forEach(instance => instance.scene.sourceLabel = this.webcam.label);
            this.notice.set('Experimental webcam sampling active.');
        }).catch(error => this.report(error));
    }

    stopWebcam(): void {
        this.webcam.stop();
        this.webcamActive.set(false);
        this.instances.forEach(instance => instance.scene.sourceLabel = 'DEMO · browser crypto');
        this.notice.set('Camera released. Demo byte source selected.');
    }

    ngOnDestroy(): void {
        this.stopped = true;
        document.removeEventListener('fullscreenchange', this.fullscreenChange);
        if (this.statusTimer) {
            clearInterval(this.statusTimer);
        }
        this.webcam.stop();
        this.instances.forEach(instance => this.dispose(instance));
        this.loader.destroy();
    }

    private importFiles(files: File[]): void {
        if (this.busy()) {
            return;
        }
        this.busy.set(true);
        this.loader.import(files).then(loaded => this.activate(loaded, false))
            .catch(error => this.report(error)).finally(() => this.busy.set(false));
    }

    private activate(loaded: LoadedDevice, add: boolean): void {
        if (this.stopped) {
            disposeObject(loaded.root);
            return;
        }
        const controls = new Map(loaded.registry.controls.map(control => [control.stateId, control.config]));
        const store = new DeviceState(loaded.definition, controls, this.bus);
        const host = document.createElement('div');
        host.className = 'scene-host';
        this.viewport.nativeElement.appendChild(host);
        let scene: SceneController;
        try {
            scene = this.zone.runOutsideAngular(() => new SceneController(host, loaded, store));
        } catch (error) {
            host.remove();
            disposeObject(loaded.root);
            throw error;
        }
        scene.sample = () => {
            if (!store.state['broadcast']) {
                return 0;
            }
            if (this.webcamActive()) {
                return this.webcam.take() ?? 0;
            }
            if (performance.now() - this.lastSampleTime > 100) {
                this.cryptoSample = crypto.getRandomValues(new Uint8Array(1))[0];
                this.lastSampleTime = performance.now();
            }
            return this.cryptoSample;
        };
        scene.sourceLabel = this.webcamActive() ? this.webcam.label : 'DEMO · browser crypto';
        const instance: Instance = {loaded, store, scene, host,
            unsubscribe: this.bus.subscribe(store.instanceId, () => {
                if (this.active?.store === store) {
                    this.refresh();
                }
            })};
        if (!add && this.active) {
            const index = this.instances.indexOf(this.active);
            this.dispose(this.active);
            this.instances.splice(index, 1);
        }
        this.instances.push(instance);
        this.instanceIds.set(this.instances.map(item => item.store.instanceId));
        this.selectInstance(store.instanceId);
        this.notice.set(loaded.contentHash ? 'Local device imported in memory.' : 'Demo ready. Drag knobs up or use the controls below.');
    }

    private dispose(instance: Instance): void {
        instance.unsubscribe();
        instance.scene.destroy();
        instance.host.remove();
    }

    private refresh(): void {
        if (!this.active) {
            return;
        }
        this.state.set(this.active.store.state);
        this.controls.set(this.active.store.controls);
        this.title.set(this.active.loaded.definition.device.name);
        this.activeId.set(this.active.store.instanceId);
        this.mode.set(this.active.store.mode);
        this.signatureChanged.set(this.active.store.signatureChanged);
        this.diagnostics.set(this.active.loaded.registry.diagnostics.map(item => `${item.level}: ${item.message}`));
    }

    private report(error: unknown): void {
        this.notice.set(String(error));
        this.diagnostics.set([...this.diagnostics(), String(error)]);
    }

    private maximizeFallback(): void {
        this.maximized.update(value => !value);
        this.notice.set('Maximized view. On iOS, use Add to Home Screen for a standalone app.');
    }

    private readonly fullscreenChange = (): void => {this.fullscreen.set(Boolean(document.fullscreenElement));};
}
