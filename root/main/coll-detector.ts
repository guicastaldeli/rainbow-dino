import * as THREE from 'three';

export class CollDetector {
    private objs: THREE.Object3D[] = [];
    private zone?: THREE.Box3;
    public box!: THREE.Box3;

    public setZone(box: THREE.Box3) {
        this.zone = box;
    }

    public addObject(obj: THREE.Object3D): void {
        if(obj && obj.position) this.objs.push(obj);
    }

    public checkBounds(): void {
        if(!this.zone) return;

        for(const obj of this.objs) {
            if(!obj || !obj.position) continue;

            obj.updateMatrixWorld(true);
            const objBox = new THREE.Box3().setFromObject(obj);

            if(this.isColliding(objBox)) {
                console.log(`Part of ${obj.name || 'Unnamed object'} is outside display area!`);
                console.log(`Object position: ${obj.position.x.toFixed(2)}, ${obj.position.y.toFixed(2)}, ${obj.position.z.toFixed(2)}`);
            }
        }
    }

    private isColliding(objBox: THREE.Box3): boolean {
        if(!this.zone) return false;
        
        return (
            objBox.max.x < this.zone.min.x / 1.2 ||
            objBox.min.x > this.zone.max.x / 1.2 ||
            objBox.max.y < this.zone.min.y / 1.4 ||
            objBox.min.y > this.zone.max.y / 1.4 ||
            objBox.max.z < this.zone.min.z ||
            objBox.min.z > this.zone.max.z
        );
    }
}