import {Control} from '../models/device.types';

export function validateRange(control: Control): void {
    const {minValue = 0, maxValue = 9, step = 1, minAngle = -135, maxAngle = 135} = control;
    if (![minValue, maxValue, step, minAngle, maxAngle].every(Number.isFinite)
        || maxValue <= minValue || step <= 0 || maxAngle === minAngle
        || Math.abs((maxValue - minValue) / step - Math.round((maxValue - minValue) / step)) > 1e-8) {
        throw new Error('Control range needs finite bounds, positive step and an integral step count.');
    }
}
export function snap(value: number, control: Control): number {
    const {minValue = 0, maxValue = 9, step = 1} = control;
    if (!Number.isFinite(value)) {
        throw new Error('Control value must be finite.');
    }
    const clamped = Math.max(minValue, Math.min(maxValue, value));
    return Number((minValue + Math.round((clamped - minValue) / step) * step).toFixed(10));
}
export function angle(value: number, control: Control): number {
    const {minValue = 0, maxValue = 9, minAngle = -135, maxAngle = 135} = control;
    return minAngle + (snap(value, control) - minValue) / (maxValue - minValue) * (maxAngle - minAngle);
}
export function valueAtAngle(degrees: number, control: Control): number {
    const {minValue = 0, maxValue = 9, minAngle = -135, maxAngle = 135} = control;
    return snap(minValue + (degrees - minAngle) / (maxAngle - minAngle) * (maxValue - minValue), control);
}
export function increment(value: number, steps: number, control: Control): number {
    const {minValue = 0, maxValue = 9, step = 1} = control;
    const count = Math.round((maxValue - minValue) / step) + 1;
    const index = Math.round((value - minValue) / step) + steps;
    return control.wrap ? minValue + ((index % count + count) % count) * step : snap(value + steps * step, control);
}
