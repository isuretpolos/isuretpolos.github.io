bl_info = {
    'name': 'Radionics Device',
    'author': 'UI3D contributors',
    'version': (1, 0, 0),
    'blender': (5, 2, 0),
    'location': 'View3D > Sidebar > Radionics Device',
    'description': 'Edit, validate and export UI3D device pairs',
    'category': 'Import-Export'
}

from . import properties, operators


def register():
    properties.register()
    operators.register()


def unregister():
    operators.unregister()
    properties.unregister()
