import {BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, SphereGeometry} from 'three';

export function createDemo(): Group {
    const scene = new Group();
    scene.name = 'demo_scene';
    scene.userData['procedural'] = true;
    const device = new Group();
    device.name = 'device_body';
    // This parent represents Blender's Z-up to glTF Y-up basis conversion.
    device.rotation.x = -Math.PI / 2;
    scene.add(device);
    const metal = new MeshStandardMaterial({color: 0x53616a, roughness: 0.45, metalness: 0.6});
    const dark = new MeshStandardMaterial({color: 0x202b31, roughness: 0.55});
    const body = new Mesh(new BoxGeometry(7, 5.8, 0.5), metal);
    body.position.z = -0.25;
    device.add(body);
    const surface = (name: string, x: number, y: number, width: number, height: number) => {
        const mesh = new Mesh(new PlaneGeometry(width, height), dark.clone());
        mesh.name = name;
        mesh.position.set(x, y, 0.035);
        device.add(mesh);
    };
    for (let index = 1; index <= 3; index++) {
        const x = (index - 2) * 2;
        const knob = new Group();
        knob.name = `knob10_${index}`;
        knob.position.set(x, -1.5, 0.2);
        const cap = new Mesh(new CylinderGeometry(0.48, 0.52, 0.32, 40), dark);
        cap.rotation.x = Math.PI / 2;
        cap.name = `knob10_${index}_cap`;
        knob.add(cap);
        const pointer = new Mesh(new BoxGeometry(0.06, 0.32, 0.025), new MeshStandardMaterial({color: 0xe7ded0}));
        pointer.position.set(0, 0.22, 0.18);
        knob.add(pointer);
        device.add(knob);
        surface(`canvas_knob10_${index}`, x, -2.35, 1.2, 0.5);
    }
    ['power', 'broadcast'].forEach((state, index) => {
        const toggle = new Group();
        toggle.name = `switch_${state}`;
        toggle.position.set(-2.65, 1.7 - index * 1.2, 0.15);
        const stem = new Mesh(new CylinderGeometry(0.08, 0.08, 0.55), metal);
        stem.rotation.x = Math.PI / 2;
        stem.position.z = 0.22;
        toggle.add(stem);
        device.add(toggle);
        const led = new Mesh(new SphereGeometry(0.12, 16, 12), dark.clone());
        led.name = `led_${state}`;
        led.position.set(-2.05, 1.7 - index * 1.2, 0.12);
        device.add(led);
    });
    surface('canvas_rate_main', 0.75, 2.15, 3.8, 0.55);
    surface('broadcastCanvas', 0.75, 0.65, 2.5, 2);
    const top = new PerspectiveCamera(42, 1, 0.01, 100);
    top.name = 'TOP_DOWN_FULLVIEW_camera';
    top.position.set(0, 10.5, 0.01);
    top.up.set(0, 0, -1);
    top.lookAt(0, 0, 0);
    const manual = new PerspectiveCamera(42, 1, 0.01, 100);
    manual.name = 'MANUAL_CAM_camera';
    manual.position.set(7, 8, 7);
    manual.lookAt(0, 0, 0);
    scene.add(top, manual);
    return scene;
}
