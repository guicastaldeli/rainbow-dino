import * as THREE from 'three';

export class ClipDetector {
    private bounds: {
        minX: number; maxX: number;
        minY: number; maxY: number;
        minZ: number; maxZ: number;
    } | null = null;

    private collObjs = new Map<THREE.Object3D, boolean>();

    public updateBounds(display: THREE.Object3D, size: { w: number, h: number, d: number }) {
        const worldPos = new THREE.Vector3();
        const worldScale = new THREE.Vector3();
        
        const halfWidth = size.w * worldScale.x / 2;
        const halfHeight = size.h * worldScale.y / 2;
        const halfDepth = size.d * worldScale.z / 2;

        this.bounds = {
            minX: worldPos.x - halfWidth,
            maxX: worldPos.x + halfWidth,
            minY: worldPos.y - halfHeight,
            maxY: worldPos.y + halfHeight,
            minZ: worldPos.z - halfDepth,
            maxZ: worldPos.z + halfDepth
        }
    }

    public checkObject(obj: THREE.Object3D, margin = 0.1): boolean {
        if(!this.bounds) return false;

        const pos = new THREE.Vector3();
        obj.getWorldPosition(pos);

        const isColliding =
        pos.x < this.bounds.minX + margin ||
        pos.x > this.bounds.maxX - margin ||
        pos.y < this.bounds.minY + margin ||
        pos.y > this.bounds.maxY - margin ||
        pos.z < this.bounds.minZ + margin ||
        pos.z > this.bounds.maxZ - margin;

        if(isColliding !== this.collObjs.get(obj)) {
            console.log(`${obj.name || 'Object'} ${isColliding ? 'entered' : 'left'} clipping zone`, { position: pos, bounds: this.bounds });
            this.collObjs.set(obj, isColliding);
        }

        return isColliding;
    }

    public checkAllObjs(scene: THREE.Scene | THREE.Group, margin = 0.1) {
        scene.traverse(obj => {
            if(obj instanceof THREE.Mesh || obj instanceof THREE.Group) {
                this.checkObject(obj, margin);
            }
        })
    }
}