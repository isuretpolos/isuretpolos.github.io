import bpy
from .export import definition, export_pair
from .validation import validate


class RADIONICS_OT_apply(bpy.types.Operator):
    bl_idname = 'radionics.apply'
    bl_label = 'Apply object properties'
    bl_options = {'REGISTER', 'UNDO'}

    def execute(self, context):
        obj = context.object
        settings = obj.radionics_device
        control = {'type': settings.control_type, 'axis': settings.axis}
        if settings.state_id:
            control['stateId'] = settings.state_id
        if settings.control_type == 'knob':
            control.update({'minAngle': settings.min_angle, 'maxAngle': settings.max_angle, 'minValue': settings.min_value,
                            'maxValue': settings.max_value, 'step': settings.step, 'defaultValue': settings.default_value,
                            'dragPixelsPerStep': settings.drag_pixels, 'wrap': settings.wrap})
        if settings.control_type == 'button':
            control.update({'mode': 'momentary', 'action': settings.action})
        if obj.name.startswith(('knob', 'switch_', 'button_')):
            obj['radionics'] = control
        if settings.binding_source or settings.binding_when:
            binding = {'target': 'led' if obj.name.startswith('led_') else 'text', 'color': settings.display_color,
                       'fontSize': settings.display_font_size}
            if settings.binding_source:
                binding['source'] = settings.binding_source
            if settings.binding_when:
                binding['when'] = settings.binding_when
            obj['binding'] = binding
        self.report({'INFO'}, f'Applied properties to {obj.name}')
        return {'FINISHED'}


class RADIONICS_OT_validate(bpy.types.Operator):
    bl_idname = 'radionics.validate'
    bl_label = 'Validate Device'

    def execute(self, context):
        try:
            errors, warnings = validate(context.scene, definition(context.scene))
            text = bpy.data.texts.get('UI3D Validation') or bpy.data.texts.new('UI3D Validation')
            text.clear()
            text.write('\n'.join(['ERROR: ' + item for item in errors] + ['WARNING: ' + item for item in warnings]) or 'Device valid.')
            self.report({'ERROR'} if errors else {'INFO'}, f'{len(errors)} errors, {len(warnings)} warnings. See UI3D Validation text.')
            return {'CANCELLED'} if errors else {'FINISHED'}
        except Exception as error:
            self.report({'ERROR'}, str(error))
            return {'CANCELLED'}


class RADIONICS_OT_export(bpy.types.Operator):
    bl_idname = 'radionics.export'
    bl_label = 'Export Device (.glb + .json)'

    def execute(self, context):
        try:
            config = definition(context.scene)
            errors, warnings = validate(context.scene, config)
            if errors:
                raise ValueError('\n'.join(errors))
            folder = context.scene.radionics_device.export_folder
            if not folder:
                raise ValueError('Select an export folder first.')
            exported = export_pair(context.scene, folder, config)
            self.report({'INFO'}, f'Exported device.glb + device.json to {exported}; {len(warnings)} warnings.')
            return {'FINISHED'}
        except Exception as error:
            self.report({'ERROR'}, str(error))
            return {'CANCELLED'}


class RADIONICS_OT_group(bpy.types.Operator):
    bl_idname = 'radionics.group'
    bl_label = 'Add rate group'
    bl_options = {'REGISTER', 'UNDO'}

    def execute(self, context):
        settings = context.scene.radionics_device
        group = settings.groups.add()
        group.group_id = 'main' if len(settings.groups) == 1 else f'group_{len(settings.groups)}'
        settings.group_index = len(settings.groups) - 1
        return {'FINISHED'}


class RADIONICS_OT_member(bpy.types.Operator):
    bl_idname = 'radionics.member'
    bl_label = 'Add rate member'
    bl_options = {'REGISTER', 'UNDO'}

    def execute(self, context):
        settings = context.scene.radionics_device
        if not settings.groups:
            return {'CANCELLED'}
        group = settings.groups[settings.group_index]
        group.members.add().state_id = context.object.name if context.object else ''
        return {'FINISHED'}


class RADIONICS_OT_move(bpy.types.Operator):
    bl_idname = 'radionics.move'
    bl_label = 'Move rate member'
    bl_options = {'REGISTER', 'UNDO'}
    direction: bpy.props.IntProperty(default=1)
    index: bpy.props.IntProperty(default=0)

    def execute(self, context):
        settings = context.scene.radionics_device
        group = settings.groups[settings.group_index]
        target = self.index + self.direction
        if 0 <= target < len(group.members):
            group.members.move(self.index, target)
        return {'FINISHED'}


class RADIONICS_PT_device(bpy.types.Panel):
    bl_label = 'Radionics Device'
    bl_idname = 'RADIONICS_PT_device'
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = 'Radionics Device'

    def draw(self, context):
        layout = self.layout
        scene = context.scene.radionics_device
        for name in ['device_id', 'device_name', 'device_version', 'rate_mode', 'top_camera', 'manual_camera', 'initial_state']:
            layout.prop(scene, name)
        if context.object:
            box = layout.box()
            box.label(text=context.object.name)
            settings = context.object.radionics_device
            for name in ['control_type', 'state_id', 'axis', 'min_angle', 'max_angle', 'min_value', 'max_value', 'step', 'default_value', 'drag_pixels', 'wrap', 'action', 'binding_source', 'binding_when', 'display_color', 'display_font_size']:
                box.prop(settings, name)
            box.operator('radionics.apply')
        layout.operator('radionics.group')
        if scene.groups:
            layout.prop(scene, 'group_index')
            index = min(max(scene.group_index, 0), len(scene.groups) - 1)
            group = scene.groups[index]
            layout.prop(group, 'group_id')
            layout.prop(group, 'separator')
            for member_index, member in enumerate(group.members):
                row = layout.row()
                row.prop(member, 'state_id', text=str(member_index + 1))
                for direction, icon in [(-1, 'TRIA_UP'), (1, 'TRIA_DOWN')]:
                    operator = row.operator('radionics.move', text='', icon=icon)
                    operator.index = member_index
                    operator.direction = direction
            layout.operator('radionics.member')
        layout.prop(scene, 'export_folder')
        layout.operator('radionics.validate')
        layout.operator('radionics.export')


classes = (RADIONICS_OT_apply, RADIONICS_OT_validate, RADIONICS_OT_export, RADIONICS_OT_group,
           RADIONICS_OT_member, RADIONICS_OT_move, RADIONICS_PT_device)


def register():
    for cls in classes:
        bpy.utils.register_class(cls)


def unregister():
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)
