import bpy
from bpy.props import BoolProperty, CollectionProperty, EnumProperty, FloatProperty, IntProperty, PointerProperty, StringProperty


class RadionicsMember(bpy.types.PropertyGroup):
    state_id: StringProperty(name='State ID')


class RadionicsGroup(bpy.types.PropertyGroup):
    group_id: StringProperty(name='Group ID', default='main')
    separator: StringProperty(name='Separator', default='-')
    members: CollectionProperty(type=RadionicsMember)
    member_index: IntProperty(default=0)


class RadionicsObject(bpy.types.PropertyGroup):
    control_type: EnumProperty(name='Type', items=[('knob', 'Knob', ''), ('switch', 'Switch', ''), ('button', 'Button', '')])
    state_id: StringProperty(name='State override')
    axis: EnumProperty(name='Blender local axis', items=[('X', 'X', ''), ('Y', 'Y', ''), ('Z', 'Z', '')], default='Z')
    min_angle: FloatProperty(name='Minimum angle', default=-135)
    max_angle: FloatProperty(name='Maximum angle', default=135)
    min_value: FloatProperty(name='Minimum value', default=0)
    max_value: FloatProperty(name='Maximum value', default=9)
    step: FloatProperty(name='Step', default=1, min=0.00001)
    default_value: FloatProperty(name='Default', default=0)
    drag_pixels: FloatProperty(name='Pixels per step', default=24, min=1)
    wrap: BoolProperty(name='Wrap', default=False)
    action: EnumProperty(name='Button action', items=[('broadcast.start', 'Start broadcast', ''), ('broadcast.stop', 'Stop broadcast', ''), ('broadcast.toggle', 'Toggle broadcast', '')])
    binding_source: StringProperty(name='Display state source')
    binding_when: StringProperty(name='Display condition')
    display_color: StringProperty(name='Display color', default='#ffbe74')
    display_font_size: IntProperty(name='Display font size', default=130, min=8, max=512)


class RadionicsScene(bpy.types.PropertyGroup):
    device_id: StringProperty(name='Device ID', default='classic-radionics')
    device_name: StringProperty(name='Device name', default='Classic Radionics')
    device_version: StringProperty(name='Device version', default='1.0.0')
    rate_mode: EnumProperty(name='Rate mode', items=[('snapshot', 'Snapshot', ''), ('live', 'Live', '')])
    top_camera: StringProperty(name='Top camera', default='TOP_DOWN_FULLVIEW_camera')
    manual_camera: StringProperty(name='Manual camera', default='MANUAL_CAM_camera')
    initial_state: StringProperty(name='Initial state JSON', default='{"power": false, "broadcast": false, "diagnose": false, "gv": 0, "hotbits": 0}')
    groups: CollectionProperty(type=RadionicsGroup)
    group_index: IntProperty(default=0)
    export_folder: StringProperty(name='Export folder', subtype='DIR_PATH')


classes = (RadionicsMember, RadionicsGroup, RadionicsObject, RadionicsScene)


def register():
    for cls in classes:
        bpy.utils.register_class(cls)
    bpy.types.Object.radionics_device = PointerProperty(type=RadionicsObject)
    bpy.types.Scene.radionics_device = PointerProperty(type=RadionicsScene)


def unregister():
    del bpy.types.Scene.radionics_device
    del bpy.types.Object.radionics_device
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)
