import { _decorator, Component, Node, Sprite, SpriteFrame, UITransform, Vec3, BoxCollider2D, Color } from 'cc';
const { ccclass, property } = _decorator;

export enum TileType {
    EMPTY = 0,
    PIKACHU = 1,
    CHARMANDER = 2,
    SQUIRTLE = 3,
    BULBASAUR = 4,
    EEVEE = 5,
    JIGGLYPUFF = 6,
    MEOWTH = 7,
    PSYDUCK = 8
}

@ccclass('TileHandler')
export class TileHandler extends Component {
    declare node: Node;

    @property(Sprite)
    tileSprite: Sprite = null;

    @property(Sprite)
    backgroundSprite: Sprite = null;

    @property([SpriteFrame])
    pokemonSprites: SpriteFrame[] = [];

    @property(SpriteFrame)
    tileBgNormal: SpriteFrame = null;

    @property(SpriteFrame)
    tileBgSelected: SpriteFrame = null;

    private tileType: TileType = TileType.EMPTY;
    private row: number = 0;
    private col: number = 0;
    private isSelected: boolean = false;

    onLoad() {
        this.findExistingBackgroundSprite();
        this.findExistingTileSprite();
    }

    initialize(type: TileType, row: number, col: number, size: number) {
        this.setTileTypeAndPosition(type, row, col);
        this.ActivateNode();
        this.setupUITransformWithSize(size);
        this.setupBackgroundSpriteWithSize(size);
        this.setupTileSpriteWithSize(size);
        this.activateBothSprites();
        this.applyVisualState();
        this.setupColliderWithSize(size);
        this.logInitializationComplete(row, col, size);
    }

    private findExistingBackgroundSprite() {
        if (!this.backgroundSprite) {
            this.backgroundSprite = this.node.getChildByName('Background')?.getComponent(Sprite);
        }
    }

    private findExistingTileSprite() {
        if (!this.tileSprite) {
            this.tileSprite = this.node.getChildByName('Sprite')?.getComponent(Sprite);
        }
    }

    private setTileTypeAndPosition(type: TileType, row: number, col: number) {
        this.tileType = type;
        this.row = row;
        this.col = col;
    }

    private ActivateNode() {
        this.node.active = true;
    }

    private setupUITransformWithSize(size: number) {
        const transform = this.getOrAddUITransform();
        transform.setContentSize(size, size);
    }

    private getOrAddUITransform(): UITransform {
        let transform = this.node.getComponent(UITransform);
        if (!transform) {
            transform = this.node.addComponent(UITransform);
        }
        return transform;
    }

    private setupBackgroundSpriteWithSize(size: number) {
        if (!this.backgroundSprite) {
            this.createBackgroundSprite(size);
        } else {
            this.updateExistingBackgroundSize(size);
        }
        this.positionBackgroundBehind();
    }

    private createBackgroundSprite(size: number) {
        const bgNode = this.createChildNode('Background');
        this.backgroundSprite = bgNode.addComponent(Sprite);
        this.backgroundSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        this.backgroundSprite.trim = false;
        this.setNodeSize(bgNode, size, size);
        bgNode.setPosition(Vec3.ZERO);
    }

    private updateExistingBackgroundSize(size: number) {
        this.backgroundSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        this.backgroundSprite.trim = false;
        this.setNodeSize(this.backgroundSprite.node, size, size);
    }

    private positionBackgroundBehind() {
        this.backgroundSprite.node.setSiblingIndex(0);
    }

    private setupTileSpriteWithSize(size: number) {
        const spriteSize = size * 0.85;
        if (!this.tileSprite) {
            this.createTileSprite(spriteSize);
        } else {
            this.updateExistingTileSpriteSize(spriteSize);
        }
        this.positionTileSpriteAbove();
    }

    private createTileSprite(size: number) {
        const spriteNode = this.createChildNode('Sprite');
        this.tileSprite = spriteNode.addComponent(Sprite);
        this.tileSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        this.tileSprite.trim = false;
        this.setNodeSize(spriteNode, size, size);
        spriteNode.setPosition(Vec3.ZERO);
    }

    private updateExistingTileSpriteSize(size: number) {
        this.tileSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        this.tileSprite.trim = false;
        this.setNodeSize(this.tileSprite.node, size, size);
    }

    private ensureSpriteSizeMatchesTransform() {
        if (!this.tileSprite || !this.tileSprite.spriteFrame) return;

        const transform = this.tileSprite.node.getComponent(UITransform);
        if (!transform) return;

        const originalSize = this.getSpriteFrameOriginalSize();
        console.log('Sprite frame original:', originalSize.width, 'x', originalSize.height);
        console.log('Applied transform:', transform.width, 'x', transform.height);
        console.log('Size mode:', this.tileSprite.sizeMode === Sprite.SizeMode.CUSTOM ? 'CUSTOM' : 'OTHER');
        console.log('Trim:', this.tileSprite.trim);
    }

    private getSpriteFrameOriginalSize(): { width: number, height: number } {
        if (!this.tileSprite?.spriteFrame) {
            return { width: 0, height: 0 };
        }

        const rect = this.tileSprite.spriteFrame.rect;
        return {
            width: rect.width,
            height: rect.height
        };
    }

    private positionTileSpriteAbove() {
        this.tileSprite.node.setSiblingIndex(1);
    }

    private createChildNode(name: string): Node {
        const node = new Node(name);
        node.setParent(this.node);
        return node;
    }

    private setNodeSize(node: Node, width: number, height: number) {
        const transform = node.getComponent(UITransform) || node.addComponent(UITransform);
        transform.setContentSize(width, height);
    }

    private activateBothSprites() {
        if (this.backgroundSprite) {
            this.backgroundSprite.node.active = true;
        }
        if (this.tileSprite) {
            this.tileSprite.node.active = true;
        }
    }

    private applyVisualState() {
        this.updateSpriteVisual();
        this.updateBackgroundVisual(false);
    }

    private setupColliderWithSize(size: number) {
        const collider = this.getOrAddCollider();
        collider.size.width = size;
        collider.size.height = size;
    }

    private getOrAddCollider(): BoxCollider2D {
        let collider = this.node.getComponent(BoxCollider2D);
        if (!collider) {
            collider = this.node.addComponent(BoxCollider2D);
        }
        return collider;
    }

    private logInitializationComplete(row: number, col: number, size: number) {
        console.log(`Tile initialized: type=${TileType[this.tileType]}, pos=(${row},${col}), size=${size}, sprites active: bg=${this.backgroundSprite?.node.active}, tile=${this.tileSprite?.node.active}`);
    }

    updateSprite() {
        this.updateSpriteVisual();
    }

    updateBackground(selected: boolean) {
        this.updateBackgroundVisual(selected);
    }

    private updateSpriteVisual() {
        if (!this.tileSprite) return;

        if (this.isTileEmpty()) {
            this.deactivateTileSprite();
        } else {
            this.assignPokemonSpriteFrame();
            this.activateTileSprite();
        }
    }

    private updateBackgroundVisual(selected: boolean) {
        if (!this.backgroundSprite) return;

        this.isSelected = selected;
        this.assignBackgroundSpriteFrame(selected);
        this.applyCustomSizeModeToBackground();
        this.activateBackgroundSprite();
    }

    private isTileEmpty(): boolean {
        return this.tileType === TileType.EMPTY;
    }

    private assignPokemonSpriteFrame() {
        if (!this.hasPokemonSprites()) {
            this.warnNoPokemonSprites();
            return;
        }

        const spriteIndex = this.calculateSpriteIndex();
        if (this.isValidSpriteIndex(spriteIndex)) {
            this.applySpriteFrame(spriteIndex);
        } else {
            this.warnInvalidSpriteIndex(spriteIndex);
        }
    }

    private hasPokemonSprites(): boolean {
        return this.pokemonSprites.length > 0;
    }

    private calculateSpriteIndex(): number {
        return this.tileType - 1;
    }

    private isValidSpriteIndex(index: number): boolean {
        return index >= 0 && index < this.pokemonSprites.length;
    }

    private applySpriteFrame(index: number) {
        this.tileSprite.spriteFrame = this.pokemonSprites[index];
        this.tileSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        this.tileSprite.trim = false;
        this.ensureSpriteSizeMatchesTransform();
    }

    private warnNoPokemonSprites() {
        console.warn(`No Pokemon sprites assigned to TileHandler! Assign sprite frames in Inspector.`);
    }

    private warnInvalidSpriteIndex(index: number) {
        console.warn(`Sprite index ${index} out of range for Pokemon sprites (length: ${this.pokemonSprites.length})`);
    }

    private activateTileSprite() {
        this.tileSprite.node.active = true;
    }

    private deactivateTileSprite() {
        this.tileSprite.node.active = false;
    }

    private assignBackgroundSpriteFrame(selected: boolean) {
        if (selected && this.tileBgSelected) {
            this.backgroundSprite.spriteFrame = this.tileBgSelected;
        } else if (this.tileBgNormal) {
            this.backgroundSprite.spriteFrame = this.tileBgNormal;
        }
        this.applyCustomSizeModeToBackground();
    }

    private applyCustomSizeModeToBackground() {
        if (!this.backgroundSprite) return;
        
        this.backgroundSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        this.backgroundSprite.trim = false;
        
        if (this.backgroundSprite.spriteFrame) {
            const bgTransform = this.backgroundSprite.node.getComponent(UITransform);
            if (bgTransform) {
                console.log('Background - Transform:', bgTransform.width, 'x', bgTransform.height);
                console.log('Background - Original frame:', 
                    this.backgroundSprite.spriteFrame.rect.width, 'x', 
                    this.backgroundSprite.spriteFrame.rect.height);
                console.log('Background - Size mode:', this.backgroundSprite.sizeMode === Sprite.SizeMode.CUSTOM ? 'CUSTOM' : 'OTHER');
                console.log('Background - Trim:', this.backgroundSprite.trim);
            }
        }
    }

    private activateBackgroundSprite() {
        this.backgroundSprite.node.active = true;
    }

    setHighlight(highlight: boolean) {
        this.updateBackgroundVisual(highlight);
        this.applyScaleEffect(highlight);
        this.applyTintEffect(highlight);
    }

    private applyScaleEffect(highlight: boolean) {
        const scale = this.calculateScaleForHighlight(highlight);
        this.node.setScale(new Vec3(scale, scale, 1));
    }

    private calculateScaleForHighlight(highlight: boolean): number {
        return highlight ? 1.1 : 1.0;
    }

    private applyTintEffect(highlight: boolean) {
        if (!this.tileSprite) return;
        
        const color = this.calculateColorForHighlight(highlight);
        this.tileSprite.color = color;
    }

    private calculateColorForHighlight(highlight: boolean): Color {
        return highlight ? new Color(255, 255, 200) : Color.WHITE;
    }

    getTileType(): TileType {
        return this.tileType;
    }

    getGridPosition(): { row: number, col: number } {
        return { row: this.row, col: this.col };
    }

    setTileType(type: TileType) {
        this.tileType = type;
        this.updateSpriteVisual();
    }

    clear() {
        this.setToEmptyState();
        this.hideSprite();
    }

    private setToEmptyState() {
        this.tileType = TileType.EMPTY;
        this.updateSpriteVisual();
    }

    private hideSprite() {
        if (this.tileSprite) {
            this.tileSprite.node.active = false;
        }
    }
}

