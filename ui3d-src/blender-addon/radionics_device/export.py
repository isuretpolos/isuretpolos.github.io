import bpy
import json
import pathlib


def definition(scene):
    settings = scene.radionics_device
    config = json.loads((pathlib.Path(__file__).parent / 'device.defaults.json').read_text(encoding='utf-8'))
    config['model'] = 'device.glb'
    config['device'] = {'id': settings.device_id, 'name': settings.device_name, 'version': settings.device_version}
    config['broadcast']['rateMode'] = settings.rate_mode
    config['initialState'] = json.loads(settings.initial_state)
    config['cameras'] = {'default': settings.top_camera, 'manual': settings.manual_camera, 'target': [0, 0, 0]}
    config['rateGroups'] = [{'id': group.group_id, 'members': [member.state_id for member in group.members],
                             'separator': group.separator, 'output': f'rate.{group.group_id}'} for group in settings.groups]
    # Empty scenes do not inherit references to the demonstration geometry.
    config['bindings'] = []
    config['broadcastSurfaces'] = []
    config['animations'] = {}
    for obj in scene.objects:
        if 'binding' in obj:
            binding = obj['binding'].to_dict()
            binding['object'] = obj.name
            config['bindings'].append(binding)
        if obj.name.startswith('broadcastCanvas') and config['rateGroups']:
            config['broadcastSurfaces'].append({'object': obj.name, 'source': f"broadcast.{config['rateGroups'][0]['id']}",
                                                 'enabledWhen': 'power && broadcast', 'fps': 24, 'resolution': [512, 512]})
    return config


def export_pair(scene, folder, config):
    folder = pathlib.Path(bpy.path.abspath(folder)).resolve()
    folder.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(folder / 'device.glb'), export_format='GLB', export_extras=True,
                              export_yup=True, export_cameras=True, export_animations=True, export_animation_mode='NLA_TRACKS')
    (folder / 'device.json').write_text(json.dumps(config, indent=4), encoding='utf-8')
    return folder
