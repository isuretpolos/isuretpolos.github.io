export type Value = number | boolean | string;
export type State = Record<string, Value>;
export interface Control {
    type: 'knob' | 'switch' | 'button';
    prefix?: string;
    stateFrom?: 'objectName' | 'suffix';
    stateId?: string;
    axis?: 'X' | 'Y' | 'Z';
    minAngle?: number;
    maxAngle?: number;
    minValue?: number;
    maxValue?: number;
    step?: number;
    defaultValue?: Value;
    dragPixelsPerStep?: number;
    wrap?: boolean;
    offAngle?: number;
    onAngle?: number;
    mode?: 'momentary' | 'toggle';
    action?: string;
}
export interface Binding {
    object: string;
    target: 'text' | 'led' | 'visibility' | 'surface';
    source?: string;
    when?: string;
    color?: string;
    fontSize?: number;
}
export interface DeviceDefinition {
    schemaVersion: string;
    device: {id: string; name: string; version: string};
    model: string;
    controlTemplates: Control[];
    objects?: Record<string, Partial<Control>>;
    initialState: State;
    rateGroups: {id: string; members: string[]; separator: string; output: string}[];
    bindings: Binding[];
    cameras?: {default: string; manual: string; target?: number[]};
    canvasDefaults?: {resolution?: number[]; color?: string; fontSize?: number; fontFamily?: string};
    broadcast: {rateMode: 'snapshot' | 'live'};
    broadcastSurfaces?: {object: string; source: string; resolution?: number[]; fps?: number; enabledWhen?: string}[];
    animations?: Record<string, {on?: string; off?: string; loop?: string}>;
    limits?: {warnModelMB?: number; maxModelMB?: number};
}
export interface Diagnostic {level: 'error' | 'warning'; message: string;}
