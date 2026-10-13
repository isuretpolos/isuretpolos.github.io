import {Vector3} from 'three';

export function controlAxis(axis: 'X' | 'Y' | 'Z' = 'Z', blenderConverted = false): Vector3 {
    if (blenderConverted) {
        // Verified against the standard Blender 5.2 glTF Y-up exporter fixture.
        return axis === 'X' ? new Vector3(1, 0, 0) : axis === 'Y' ? new Vector3(0, 0, -1) : new Vector3(0, 1, 0);
    }
    return axis === 'X' ? new Vector3(1, 0, 0) : axis === 'Y' ? new Vector3(0, 1, 0) : new Vector3(0, 0, 1);
}
