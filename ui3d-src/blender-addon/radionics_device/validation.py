import math
import re


def validate(scene, config):
    errors = []
    warnings = []
    names = {obj.name for obj in scene.objects}
    states = set(config['initialState'])
    registered = set()
    prefixes = [template['prefix'] for template in config['controlTemplates']]
    if len(prefixes) != len(set(prefixes)):
        errors.append('Equal template prefix ties.')
    if not re.fullmatch(r'[A-Za-z0-9_-]+', config['device']['id']):
        errors.append('Device ID must contain only letters, digits, underscores and hyphens.')
    if not re.fullmatch(r'\d+\.\d+\.\d+', config['device']['version']):
        errors.append('Device version must be major.minor.patch.')
    if not isinstance(config['initialState'], dict):
        errors.append('Initial state must be a JSON object.')
        return errors, warnings
    state_owners = {}

    def walk(obj, within_control=False):
        if re.search(r'\.\d{3}$', obj.name):
            errors.append(f'Rename Blender duplicate suffix: {obj.name}')
        if ' ' in obj.name:
            warnings.append(f'Name contains spaces: {obj.name}')
        matching = sorted([template for template in config['controlTemplates'] if obj.name.startswith(template['prefix'])], key=lambda template: len(template['prefix']), reverse=True)
        control = None
        if matching and not within_control:
            control = dict(matching[0])
            if 'radionics' in obj:
                control.update(obj['radionics'].to_dict())
            state = control.get('stateId') or (obj.name[len(control['prefix']):] if control.get('stateFrom') == 'suffix' else obj.name)
            if state in state_owners:
                errors.append(f'Duplicate state {state}: {state_owners[state]}, {obj.name}')
            state_owners[state] = obj.name
            states.add(state)
            registered.add(obj.name)
            if control['type'] == 'knob':
                low = control.get('minValue', 0)
                high = control.get('maxValue', 9)
                step = control.get('step', 1)
                count = (high - low) / step if step > 0 else float('nan')
                if not math.isfinite(count) or count <= 0 or abs(count - round(count)) > 1e-8 or control.get('minAngle', -135) == control.get('maxAngle', 135):
                    errors.append(f'Invalid value/angle range: {obj.name}')
        elif matching and within_control:
            warnings.append(f'Descendant control prefix ignored: {obj.name}')
        if obj.name.startswith('canvas_') or obj.name.startswith('broadcastCanvas'):
            if obj.type != 'MESH' or len(obj.data.polygons) == 0 or not obj.data.uv_layers:
                errors.append(f'Display needs nonempty mesh with UVs: {obj.name}')
        for child in obj.children:
            walk(child, within_control or control is not None)

    for obj in scene.objects:
        if obj.parent is None:
            walk(obj)
    groups = set()
    for group in config['rateGroups']:
        if not group['members'] or group['id'] in groups:
            errors.append(f'Empty or duplicate rate group: {group["id"]}')
        groups.add(group['id'])
        for member in group['members']:
            if member not in states:
                errors.append(f'Missing rate member: {member}')
        states.update([group['output'], f'broadcast.{group["id"]}'])
    for binding in config['bindings']:
        if binding['object'] not in names:
            errors.append(f'Missing binding object: {binding["object"]}')
        source = binding.get('source')
        if source and not re.fullmatch(r'[A-Za-z_][\w.]*', source):
            errors.append(f'{binding["object"]}: source is a state key; use when for conditions.')
        elif source and source not in states:
            errors.append(f'Missing source: {source}')
        if binding['target'] == 'text' and not source:
            errors.append(f'{binding["object"]}: text requires source.')
        condition = binding.get('when', '')
        if condition:
            tokens = re.findall(r'&&|\|\||===|!==|==|!=|>=|<=|[()!<>]|-?\d+(?:\.\d+)?|[A-Za-z_][\w.]*', condition)
            if ''.join(tokens) != re.sub(r'\s+', '', condition) or condition.count('(') != condition.count(')'):
                errors.append(f'Malformed condition: {condition}')
            for token in tokens:
                if re.fullmatch(r'[A-Za-z_][\w.]*', token) and token not in states and token not in ['true', 'false']:
                    errors.append(f'Unknown condition state: {token}')
    namespaces = {key.split('.')[0] for key in states if '.' in key}
    explicit = {binding['object'] for binding in config['bindings']}
    for name in names:
        if name.startswith('canvas_') and name not in explicit:
            remainder = name[7:]
            prefix, _, suffix = remainder.partition('_')
            derived = f'{prefix}.{suffix}' if prefix in namespaces else ''
            if remainder in states and derived in states:
                errors.append(f'Ambiguous canvas: {name}')
            elif remainder not in states and derived not in states:
                warnings.append(f'Unbound canvas: {name}')
    for name in config['cameras'].values():
        if isinstance(name, str) and name not in names:
            warnings.append(f'Missing camera: {name}')
    return errors, warnings
