"""Headless smoke test: registration, property editing, validation and pair export."""
import bpy
import importlib.util
import pathlib
import sys

root = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / 'blender-addon'))
import radionics_device
from radionics_device.export import definition
from radionics_device.validation import validate

radionics_device.register()
spec = importlib.util.spec_from_file_location('sample_device', root / 'blender-addon' / 'sample_device.py')
sample = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sample)
scene = sample.build_scene()
settings = scene.radionics_device
group = settings.groups.add()
group.group_id = 'main'
for index in [1, 2, 3]:
    group.members.add().state_id = f'knob10_{index}'
group.members.move(2, 1)
group.members.move(1, 2)
settings.export_folder = str(root / 'tools' / 'roundtrip-output' / 'addon')
bpy.context.view_layer.objects.active = bpy.data.objects['knob10_1']
bpy.context.object.radionics_device.control_type = 'knob'
assert bpy.ops.radionics.apply() == {'FINISHED'}
config = definition(scene)
errors, warnings = validate(scene, config)
assert not errors, errors
assert config['rateGroups'][0]['members'] == ['knob10_1', 'knob10_2', 'knob10_3']
assert bpy.ops.radionics.export() == {'FINISHED'}
assert (pathlib.Path(settings.export_folder) / 'device.glb').is_file()
bpy.data.objects['knob10_2'].name = 'knob10_1.001'
errors, _ = validate(scene, definition(scene))
assert any('suffix' in error for error in errors)
radionics_device.unregister()
print('PASS: add-on register/edit/ordered-members/validate/export/suffix-reject/unregister')
