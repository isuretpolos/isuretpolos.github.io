"""Create the reproducible UI3D sample using Blender's authored Z-up space."""
import bpy
import math
from mathutils import Vector


def material(name, color, metallic=0.0):
    result = bpy.data.materials.new(name)
    result.diffuse_color = (*color, 1.0)
    result.use_nodes = True
    shader = result.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1.0)
    shader.inputs['Metallic'].default_value = metallic
    return result


def mesh(name, location, scale, kind, surface):
    if kind == 'plane':
        bpy.ops.mesh.primitive_plane_add(size=2, location=location)
    elif kind == 'cylinder':
        bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=1, depth=2, location=location)
    elif kind == 'sphere':
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, location=location)
    else:
        bpy.ops.mesh.primitive_cube_add(size=2, location=location)
    result = bpy.context.object
    result.name = name
    result.scale = scale
    result.data.materials.append(surface)
    return result


def build_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    dark = material('UI3D_dark', (0.025, 0.04, 0.05))
    metal = material('UI3D_metal', (0.28, 0.35, 0.4), 0.65)
    light = material('UI3D_pointer', (0.9, 0.85, 0.75))
    mesh('body', (0, 0, -0.25), (3.5, 2.9, 0.25), 'cube', metal)
    for index in range(1, 4):
        x = (index - 2) * 2
        root = bpy.data.objects.new(f'knob10_{index}', None)
        bpy.context.collection.objects.link(root)
        root.location = (x, -1.5, 0.2)
        root['radionics'] = {'axis': 'Z', 'type': 'knob'}
        cap = mesh(f'knob10_{index}_cap', (0, 0, 0), (0.5, 0.5, 0.16), 'cylinder', dark)
        cap.parent = root
        pointer = mesh(f'pointer_{index}', (0, 0.22, 0.18), (0.03, 0.16, 0.012), 'cube', light)
        pointer.parent = root
        mesh(f'canvas_knob10_{index}', (x, -2.35, 0.035), (0.6, 0.25, 1), 'plane', dark)
    for index, state in enumerate(['power', 'broadcast']):
        root = bpy.data.objects.new(f'switch_{state}', None)
        bpy.context.collection.objects.link(root)
        root.location = (-2.65, 1.7 - index * 1.2, 0.15)
        stem = mesh(f'stem_{state}', (0, 0, 0.22), (0.08, 0.08, 0.28), 'cylinder', metal)
        stem.parent = root
        mesh(f'led_{state}', (-2.05, 1.7 - index * 1.2, 0.12), (0.12, 0.12, 0.12), 'sphere', dark)
    mesh('canvas_rate_main', (0.75, 2.15, 0.035), (1.9, 0.275, 1), 'plane', dark)
    mesh('broadcastCanvas', (0.75, 0.65, 0.04), (1.25, 1, 1), 'plane', dark)
    for name, position in [('TOP_DOWN_FULLVIEW_camera', (0, -0.01, 10.5)), ('MANUAL_CAM_camera', (7, -7, 8))]:
        data = bpy.data.cameras.new(name)
        data.lens = 42
        camera = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(camera)
        camera.location = position
        camera.rotation_euler = (Vector((0, 0, 0)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    # A non-control indicator exercises animation export without rotation ownership conflicts.
    indicator = mesh('animation_indicator', (2.8, 2.6, 0.08), (0.06, 0.06, 0.06), 'sphere', light)
    broadcast_indicator = mesh('broadcast_indicator', (2.5, 2.6, 0.08), (0.06, 0.06, 0.06), 'sphere', light)
    for name, values in [('POWER_ON_anim', [0.08, 0.18]), ('POWER_OFF_anim', [0.18, 0.08]), ('BROADCAST_ACTIVE_LOOP_anim', [0.08, 0.18, 0.08])]:
        if name == 'BROADCAST_ACTIVE_LOOP_anim':
            indicator = broadcast_indicator
        if indicator.animation_data:
            indicator.animation_data.action = None
        for frame, value in zip([1, 7, 13], values):
            indicator.location.z = value
            indicator.keyframe_insert(data_path='location', frame=frame)
        action = indicator.animation_data.action
        action.name = name
        track = indicator.animation_data.nla_tracks.new()
        track.name = name
        track.strips.new(name, 1, action)
        indicator.animation_data.action = None
    bpy.context.scene.frame_set(1)
    return bpy.context.scene


if __name__ == '__main__':
    build_scene()
