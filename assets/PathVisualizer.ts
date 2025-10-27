import { _decorator, Component, Node, Graphics, Vec3, Color, tween } from 'cc';
const { ccclass, property } = _decorator;

export interface PathPoint {
    x: number;
    y: number;
}

@ccclass('PathVisualizer')
export class PathVisualizer extends Component {
    declare node: Node;

    @property
    lineWidth: number = 4;

    @property(Color)
    lineColor: Color = new Color(255, 215, 0, 255);

    @property
    animationDuration: number = 0.3; 

    @property
    fadeOutDuration: number = 0.2; 

    private graphics: Graphics = null;

    onLoad() {
        this.graphics = this.node.addComponent(Graphics);
    }

    drawPath(path: PathPoint[], onComplete?: () => void) {
        if (!this.graphics || path.length < 2) {
            if (onComplete) onComplete();
            return;
        }

        this.graphics.clear();

        const totalLength = this.calculatePathLength(path);

        this.animatePathDrawing(path, totalLength, onComplete);
    }

    private calculatePathLength(path: PathPoint[]): number {
        let length = 0;
        for (let i = 0; i < path.length - 1; i++) {
            const dx = path[i + 1].x - path[i].x;
            const dy = path[i + 1].y - path[i].y;
            length += Math.sqrt(dx * dx + dy * dy);
        }
        return length;
    }

    private animatePathDrawing(path: PathPoint[], totalLength: number, onComplete?: () => void) {
        let progress = 0;

        const animData = { value: 0 };

        tween(animData)
            .to(this.animationDuration, { value: 1 }, {
                onUpdate: () => {
                    progress = animData.value;
                    this.drawPartialPath(path, progress);
                }
            })
            .call(() => {
                this.fadeOutPath(onComplete);
            })
            .start();
    }

    private drawPartialPath(path: PathPoint[], progress: number) {
        if (!this.graphics) return;

        this.graphics.clear();
        this.graphics.lineWidth = this.lineWidth;
        this.graphics.strokeColor = this.lineColor;

        if (progress <= 0 || path.length < 2) return;

        const totalLength = this.calculatePathLength(path);
        const targetLength = totalLength * progress;

        let drawnLength = 0;
        this.graphics.moveTo(path[0].x, path[0].y);

        for (let i = 0; i < path.length - 1; i++) {
            const p1 = path[i];
            const p2 = path[i + 1];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const segmentLength = Math.sqrt(dx * dx + dy * dy);

            if (drawnLength + segmentLength <= targetLength) {
                this.graphics.lineTo(p2.x, p2.y);
                drawnLength += segmentLength;
            } else {
                const remainingLength = targetLength - drawnLength;
                const ratio = remainingLength / segmentLength;
                const x = p1.x + dx * ratio;
                const y = p1.y + dy * ratio;
                this.graphics.lineTo(x, y);
                break;
            }
        }

        this.graphics.stroke();
    }

    private fadeOutPath(onComplete?: () => void) {
        const animData = { alpha: 1 };

        tween(animData)
            .to(this.fadeOutDuration, { alpha: 0 }, {
                onUpdate: () => {
                    if (this.graphics) {
                        const color = new Color(
                            this.lineColor.r,
                            this.lineColor.g,
                            this.lineColor.b,
                            this.lineColor.a * animData.alpha
                        );
                        this.graphics.strokeColor = color;
                    }
                }
            })
            .call(() => {
                if (this.graphics) {
                    this.graphics.clear();
                }
                if (onComplete) onComplete();
            })
            .start();
    }

    clearPath() {
        if (this.graphics) {
            this.graphics.clear();
        }
    }
        
    drawPathImmediate(path: PathPoint[]) {
        if (!this.graphics || path.length < 2) return;

        this.graphics.clear();
        this.graphics.lineWidth = this.lineWidth;
        this.graphics.strokeColor = this.lineColor;

        this.graphics.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            this.graphics.lineTo(path[i].x, path[i].y);
        }
        this.graphics.stroke();
    }
}

