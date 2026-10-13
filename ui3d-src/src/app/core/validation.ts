import Ajv from 'ajv';
import schema from '../../../device.schema.json';
import {DeviceDefinition} from '../models/device.types';
import {Binding, Control} from '../models/device.types';
import {validateRange} from './control-mapping';

const validator = new Ajv({allErrors: true, allowUnionTypes: true}).compile<DeviceDefinition>(schema);
const controlValidator = new Ajv({allErrors: true, allowUnionTypes: true}).compile<Control>(schema.definitions.control);
const bindingValidator = new Ajv({allErrors: true}).compile<Binding>(schema.definitions.binding);

export function validateBinding(value: unknown): Binding {
    if (!bindingValidator(value)) {
        throw new Error(bindingValidator.errors?.map(error => `${error.instancePath} ${error.message}`).join('; '));
    }
    return value;
}

export function validateControl(config: unknown): Control {
    if (!controlValidator(config)) {
        throw new Error(controlValidator.errors?.map(error => `${error.instancePath} ${error.message}`).join('; '));
    }
    if (!config.type) {
        throw new Error('Control type is required.');
    }
    if (config.type === 'knob') {
        validateRange(config);
        if (config.defaultValue !== undefined && (typeof config.defaultValue !== 'number'
            || config.defaultValue < (config.minValue ?? 0) || config.defaultValue > (config.maxValue ?? 9))) {
            throw new Error('Knob defaultValue must be a number within its range.');
        }
    } else if (config.defaultValue !== undefined && typeof config.defaultValue !== 'boolean') {
        throw new Error('Switch/button defaultValue must be boolean.');
    }
    return config;
}

export function validateDefinition(value: unknown): DeviceDefinition {
    if (!validator(value)) {
        throw new Error(validator.errors?.map(error => `${error.instancePath || '/'} ${error.message}`).join('\n'));
    }
    const definition = value as DeviceDefinition;
    const prefixes = new Set<string>();
    definition.controlTemplates.forEach(template => {
        if (prefixes.has(template.prefix!)) {
            throw new Error(`Equal template prefix tie: ${template.prefix}`);
        }
        prefixes.add(template.prefix!);
        if (template.type === 'knob') {
            validateRange(template);
        }
    });
    const groups = new Set<string>();
    definition.rateGroups.forEach(group => {
        if (groups.has(group.id) || group.output !== `rate.${group.id}`) {
            throw new Error(`Invalid or duplicate rate group: ${group.id}`);
        }
        groups.add(group.id);
    });
    definition.bindings.forEach(binding => {
        if (binding.target === 'text' && !binding.source) {
            throw new Error(`${binding.object}: text binding requires source.`);
        }
        if (binding.source && !/^[A-Za-z_][\w.]*$/.test(binding.source)) {
            throw new Error(`${binding.object}: source must be a state key; use when for expressions.`);
        }
        if ((binding.target === 'led' || binding.target === 'visibility') && !binding.source && !binding.when) {
            throw new Error(`${binding.object}: binding requires source or when.`);
        }
    });
    if (definition.model !== 'procedural' && !/^[\w./-]+\.glb$/.test(definition.model)) {
        throw new Error('model must be a local .glb asset path.');
    }
    if (definition.model.split('/').includes('..') || definition.model.startsWith('/')) {
        throw new Error('model path must stay within the device folder.');
    }
    return structuredClone(definition);
}
