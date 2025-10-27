import { _decorator, Component, Node, Prefab, instantiate, Vec3, Camera } from 'cc';
import { TileHandler, TileType } from './TileHandler';
import { PathVisualizer, PathPoint } from './PathVisualizer';
const { ccclass, property } = _decorator;

export interface GridTile {
    type: TileType;
    node: Node | null;
    handler: TileHandler | null;
    row: number;
    col: number;
}

@ccclass('GridManager')
export class GridManager extends Component {
    declare node: Node;

    @property
    rows: number = 8;

    @property
    columns: number = 10;

    @property
    tileSize: number = 80;

    @property
    tileSpacing: number = 10;

    @property(Prefab)
    tilePrefab: Prefab = null;

    @property
    pokemonTypesCount: number = 6;

    @property(Camera)
    mainCamera: Camera = null;

    @property
    fitToCamera: boolean = true;

    @property
    padding: number = 50;

    @property(PathVisualizer)
    pathVisualizer: PathVisualizer | null = null;

    private grid: GridTile[][] = [];
    private selectedTile: GridTile | null = null;
    private onGameCompleteCallback: (() => void) | null = null;

    start() {
        this.setupCameraAlignment();
        this.initializeGrid();
    }

    setGameCompleteCallback(callback: () => void) {
        this.onGameCompleteCallback = callback;
    }

    private setupCameraAlignment() {
        if (!this.mainCamera) return;

        this.centerGridManagerPosition();
        if (this.fitToCamera) {
            this.adjustGridToCamera();
        }
    }

    private centerGridManagerPosition() {
        const cameraPos = this.getCameraWorldPosition();
        this.node.setWorldPosition(cameraPos);
        this.logGridCenterPosition(cameraPos);
    }

    private getCameraWorldPosition(): Vec3 {
        return this.mainCamera.node.getWorldPosition();
    }

    private logGridCenterPosition(pos: Vec3) {
        console.log(`GridManager centered at: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})`);
    }

    private adjustGridToCamera() {
        const cameraSize = this.calculateCameraSize();
        const availableSpace = this.calculateAvailableSpace(cameraSize);
        const gridSize = this.calculateCurrentGridSize();
        const requiredScale = this.calculateRequiredScale(availableSpace, gridSize);

        if (this.shouldScaleDown(requiredScale)) {
            this.applyScaleToTiles(requiredScale);
            this.logScalingApplied();
        }

        this.logCameraAndGridSize(cameraSize, gridSize);
    }

    private calculateCameraSize(): { width: number, height: number } {
        const height = this.mainCamera.orthoHeight * 2;
        const aspect = this.getCameraAspectRatio();
        const width = height * aspect;
        return { width, height };
    }

    private getCameraAspectRatio(): number {
        const camera = this.mainCamera.node.getComponent(Camera).camera;
        return camera.width / camera.height;
    }

    private calculateAvailableSpace(cameraSize: { width: number, height: number }): { width: number, height: number } {
        return {
            width: cameraSize.width - this.padding * 2,
            height: cameraSize.height - this.padding * 2
        };
    }

    private calculateCurrentGridSize(): { width: number, height: number } {
        const tileTotal = this.tileSize + this.tileSpacing;
        return {
            width: this.columns * tileTotal - this.tileSpacing,
            height: this.rows * tileTotal - this.tileSpacing
        };
    }

    private calculateRequiredScale(availableSpace: { width: number, height: number }, gridSize: { width: number, height: number }): number {
        const scaleX = availableSpace.width / gridSize.width;
        const scaleY = availableSpace.height / gridSize.height;
        return Math.min(scaleX, scaleY);
    }

    private shouldScaleDown(scale: number): boolean {
        return scale < 1;
    }

    private applyScaleToTiles(scale: number) {
        this.tileSize *= scale;
        this.tileSpacing *= scale;
    }

    private logScalingApplied() {
        console.log(`Grid auto-scaled to fit camera: tileSize=${this.tileSize.toFixed(1)}, spacing=${this.tileSpacing.toFixed(1)}`);
    }

    private logCameraAndGridSize(cameraSize: { width: number, height: number }, gridSize: { width: number, height: number }) {
        console.log(`Camera view: ${cameraSize.width.toFixed(1)}x${cameraSize.height.toFixed(1)}, Grid size: ${gridSize.width.toFixed(1)}x${gridSize.height.toFixed(1)}`);
    }


    private initializeGrid() {
        this.createEmptyGrid();
        this.generateTiles();
        this.renderGrid();
    }

    private createEmptyGrid() {
        this.grid = [];
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = this.createEmptyRow(row);
        }
    }

    private createEmptyRow(row: number): GridTile[] {
        const rowTiles: GridTile[] = [];
        for (let col = 0; col < this.columns; col++) {
            rowTiles.push(this.createEmptyTile(row, col));
        }
        return rowTiles;
    }

    private createEmptyTile(row: number, col: number): GridTile {
        return {
            type: TileType.EMPTY,
            node: null,
            handler: null,
            row: row,
            col: col
        };
    }

    private generateTiles() {
        const tileTypes = this.createPairedTileTypes();
        this.shuffleArray(tileTypes);
        this.assignTileTypesToGrid(tileTypes);
    }

    private createPairedTileTypes(): TileType[] {
        const tilesArray: TileType[] = [];
        const pairsNeeded = this.calculatePairsNeeded();

        for (let i = 0; i < pairsNeeded; i++) {
            const tileType = this.getPokemonTypeForPair(i);
            this.addTilePair(tilesArray, tileType);
        }

        return tilesArray;
    }

    private calculatePairsNeeded(): number {
        const totalTiles = this.rows * this.columns;
        return Math.floor(totalTiles / 2);
    }

    private getPokemonTypeForPair(pairIndex: number): TileType {
        return (pairIndex % this.pokemonTypesCount) + 1;
    }

    private addTilePair(array: TileType[], tileType: TileType) {
        array.push(tileType);
        array.push(tileType);
    }

    private assignTileTypesToGrid(tileTypes: TileType[]) {
        let index = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                if (this.hasMoreTiles(index, tileTypes)) {
                    this.grid[row][col].type = tileTypes[index];
                    index++;
                }
            }
        }
    }

    private hasMoreTiles(index: number, tileTypes: TileType[]): boolean {
        return index < tileTypes.length;
    }

    private renderGrid() {
        if (!this.hasTilePrefab()) {
            this.warnMissingTilePrefab();
            return;
        }

        this.clearExistingTiles();
        const startPosition = this.calculateGridStartPosition();
        this.logGridRenderingPosition(startPosition);
        this.createAllTileNodes(startPosition);
    }

    private hasTilePrefab(): boolean {
        return this.tilePrefab !== null;
    }

    private warnMissingTilePrefab() {
        console.error("Tile prefab is not assigned!");
    }

    private clearExistingTiles() {
        const children = this.node.children.slice();
        for (const child of children) {
            if (this.isNotPathVisualizer(child)) {
                child.destroy();
            }
        }
    }

    private isNotPathVisualizer(node: Node): boolean {
        return !node.getComponent(PathVisualizer);
    }

    private calculateGridStartPosition(): { x: number, y: number } {
        const gridSize = this.calculateCurrentGridSize();
        return {
            x: -gridSize.width / 2 + this.tileSize / 2,
            y: gridSize.height / 2 - this.tileSize / 2
        };
    }

    private logGridRenderingPosition(startPos: { x: number, y: number }) {
        const gridSize = this.calculateCurrentGridSize();
        console.log(`Grid rendering at: startX=${startPos.x.toFixed(1)}, startY=${startPos.y.toFixed(1)}, gridSize=${gridSize.width.toFixed(1)}x${gridSize.height.toFixed(1)}`);
    }

    private createAllTileNodes(startPosition: { x: number, y: number }) {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                this.createTileNodeIfNotEmpty(row, col, startPosition);
            }
        }
    }

    private createTileNodeIfNotEmpty(row: number, col: number, startPosition: { x: number, y: number }) {
        const tile = this.grid[row][col];
        if (this.isTileEmpty(tile)) return;

        const tileNode = this.instantiateTileNode();
        const position = this.calculateTilePosition(row, col, startPosition);
        this.positionTileNode(tileNode, position);

        const handler = this.setupTileHandler(tileNode, tile, row, col);
        this.attachClickEvent(tileNode, row, col);
        this.storeTileReferences(tile, tileNode, handler);
        this.nameTileNode(tileNode, row, col, tile.type);
    }

    private isTileEmpty(tile: GridTile): boolean {
        return tile.type === TileType.EMPTY;
    }

    private instantiateTileNode(): Node {
        const node = instantiate(this.tilePrefab);
        node.setParent(this.node);
        return node;
    }

    private calculateTilePosition(row: number, col: number, startPosition: { x: number, y: number }): Vec3 {
        const x = startPosition.x + col * (this.tileSize + this.tileSpacing);
        const y = startPosition.y - row * (this.tileSize + this.tileSpacing);
        return new Vec3(x, y, 0);
    }

    private positionTileNode(node: Node, position: Vec3) {
        node.setPosition(position);
    }

    private setupTileHandler(node: Node, tile: GridTile, row: number, col: number): TileHandler {
        const handler = this.getOrAddTileHandler(node);
        handler.initialize(tile.type, row, col, this.tileSize);
        return handler;
    }

    private getOrAddTileHandler(node: Node): TileHandler {
        let handler = node.getComponent(TileHandler);
        if (!handler) {
            handler = node.addComponent(TileHandler);
        }
        return handler;
    }

    private attachClickEvent(node: Node, row: number, col: number) {
        node.on(Node.EventType.TOUCH_END, () => {
            this.onTileSelected(row, col);
        }, this);
    }

    private storeTileReferences(tile: GridTile, node: Node, handler: TileHandler) {
        tile.node = node;
        tile.handler = handler;
    }

    private nameTileNode(node: Node, row: number, col: number, type: TileType) {
        node.name = `Tile_${row}_${col}_${TileType[type]}`;
    }

    private canConnect(tile1: GridTile, tile2: GridTile): boolean {
        if (!this.tilesHaveSameType(tile1, tile2)) return false;
        if (this.tilesAreIdentical(tile1, tile2)) return false;
        return this.hasValidPath(tile1, tile2);
    }

    private tilesHaveSameType(tile1: GridTile, tile2: GridTile): boolean {
        return tile1.type === tile2.type;
    }

    private tilesAreIdentical(tile1: GridTile, tile2: GridTile): boolean {
        return tile1.row === tile2.row && tile1.col === tile2.col;
    }

    private hasValidPath(tile1: GridTile, tile2: GridTile): boolean {
        return this.checkDirectLine(tile1, tile2) ||
               this.checkOneTurn(tile1, tile2) ||
               this.checkTwoTurns(tile1, tile2);
    }

    private getConnectionPath(tile1: GridTile, tile2: GridTile): PathPoint[] | null {
        if (!this.tilesHaveSameType(tile1, tile2)) return null;
        if (this.tilesAreIdentical(tile1, tile2)) return null;

        return this.getDirectLinePath(tile1, tile2) ||
               this.getOneTurnPath(tile1, tile2) ||
               this.getTwoTurnPath(tile1, tile2) ||
               null;
    }

    private convertGridToWorldPosition(row: number, col: number): PathPoint {
        const startPosition = this.calculateGridStartPosition();
        return {
            x: startPosition.x + col * (this.tileSize + this.tileSpacing),
            y: startPosition.y - row * (this.tileSize + this.tileSpacing)
        };
    }

    private getDirectLinePath(tile1: GridTile, tile2: GridTile): PathPoint[] | null {
        if (!this.checkDirectLine(tile1, tile2)) return null;

        return [
            this.convertGridToWorldPosition(tile1.row, tile1.col),
            this.convertGridToWorldPosition(tile2.row, tile2.col)
        ];
    }

    private getOneTurnPath(tile1: GridTile, tile2: GridTile): PathPoint[] | null {
        const path = this.tryFirstCornerPath(tile1, tile2);
        if (path) return path;

        return this.trySecondCornerPath(tile1, tile2);
    }

    private tryFirstCornerPath(tile1: GridTile, tile2: GridTile): PathPoint[] | null {
        const corner = this.getTileAt(tile1.row, tile2.col);
        if (!corner || !this.isCornerValidForPath(corner, tile1, tile2)) return null;

        return [
            this.convertGridToWorldPosition(tile1.row, tile1.col),
            this.convertGridToWorldPosition(corner.row, corner.col),
            this.convertGridToWorldPosition(tile2.row, tile2.col)
        ];
    }

    private trySecondCornerPath(tile1: GridTile, tile2: GridTile): PathPoint[] | null {
        const corner = this.getTileAt(tile2.row, tile1.col);
        if (!corner || !this.isCornerValidForPath(corner, tile1, tile2)) return null;

        return [
            this.convertGridToWorldPosition(tile1.row, tile1.col),
            this.convertGridToWorldPosition(corner.row, corner.col),
            this.convertGridToWorldPosition(tile2.row, tile2.col)
        ];
    }

    private isCornerValidForPath(corner: GridTile | null, tile1: GridTile, tile2: GridTile): boolean {
        if (!corner || corner.type !== TileType.EMPTY) return false;

        return this.isPathClear(tile1.row, tile1.col, corner.row, corner.col) &&
               this.isPathClear(corner.row, corner.col, tile2.row, tile2.col);
    }

    private getTwoTurnPath(tile1: GridTile, tile2: GridTile): PathPoint[] | null {
        const horizontalPath = this.tryHorizontalTwoTurnPath(tile1, tile2);
        if (horizontalPath) return horizontalPath;

        return this.tryVerticalTwoTurnPath(tile1, tile2);
    }

    private tryHorizontalTwoTurnPath(tile1: GridTile, tile2: GridTile): PathPoint[] | null {
        for (let col = 0; col < this.columns; col++) {
            if (this.isColumnOccupiedByTiles(col, tile1, tile2)) continue;

            const path = this.buildHorizontalTwoTurnPath(tile1, tile2, col);
            if (path) return path;
        }
        return null;
    }

    private tryVerticalTwoTurnPath(tile1: GridTile, tile2: GridTile): PathPoint[] | null {
        for (let row = 0; row < this.rows; row++) {
            if (this.isRowOccupiedByTiles(row, tile1, tile2)) continue;

            const path = this.buildVerticalTwoTurnPath(tile1, tile2, row);
            if (path) return path;
        }
        return null;
    }

    private isColumnOccupiedByTiles(col: number, tile1: GridTile, tile2: GridTile): boolean {
        return col === tile1.col || col === tile2.col;
    }

    private isRowOccupiedByTiles(row: number, tile1: GridTile, tile2: GridTile): boolean {
        return row === tile1.row || row === tile2.row;
    }

    private buildHorizontalTwoTurnPath(tile1: GridTile, tile2: GridTile, middleCol: number): PathPoint[] | null {
        const mid1 = this.getTileAt(tile1.row, middleCol);
        const mid2 = this.getTileAt(tile2.row, middleCol);

        if (!mid1 || !mid2 || !this.areMidpointsValidForPath(mid1, mid2, tile1, tile2)) return null;

        return [
            this.convertGridToWorldPosition(tile1.row, tile1.col),
            this.convertGridToWorldPosition(mid1.row, mid1.col),
            this.convertGridToWorldPosition(mid2.row, mid2.col),
            this.convertGridToWorldPosition(tile2.row, tile2.col)
        ];
    }

    private buildVerticalTwoTurnPath(tile1: GridTile, tile2: GridTile, middleRow: number): PathPoint[] | null {
        const mid1 = this.getTileAt(middleRow, tile1.col);
        const mid2 = this.getTileAt(middleRow, tile2.col);

        if (!mid1 || !mid2 || !this.areMidpointsValidForPath(mid1, mid2, tile1, tile2)) return null;

        return [
            this.convertGridToWorldPosition(tile1.row, tile1.col),
            this.convertGridToWorldPosition(mid1.row, mid1.col),
            this.convertGridToWorldPosition(mid2.row, mid2.col),
            this.convertGridToWorldPosition(tile2.row, tile2.col)
        ];
    }

    private areMidpointsValidForPath(mid1: GridTile | null, mid2: GridTile | null, tile1: GridTile, tile2: GridTile): boolean {
        if (!mid1 || !mid2) return false;
        if (mid1.type !== TileType.EMPTY || mid2.type !== TileType.EMPTY) return false;

        return this.isPathClear(tile1.row, tile1.col, mid1.row, mid1.col) &&
               this.isPathClear(mid1.row, mid1.col, mid2.row, mid2.col) &&
               this.isPathClear(mid2.row, mid2.col, tile2.row, tile2.col);
    }

    private checkDirectLine(tile1: GridTile, tile2: GridTile): boolean {
        if (this.tilesAreOnSameRow(tile1, tile2)) {
            return this.isPathClear(tile1.row, tile1.col, tile2.row, tile2.col);
        }

        if (this.tilesAreOnSameColumn(tile1, tile2)) {
            return this.isPathClear(tile1.row, tile1.col, tile2.row, tile2.col);
        }

        return false;
    }

    private tilesAreOnSameRow(tile1: GridTile, tile2: GridTile): boolean {
        return tile1.row === tile2.row;
    }

    private tilesAreOnSameColumn(tile1: GridTile, tile2: GridTile): boolean {
        return tile1.col === tile2.col;
    }

    private checkOneTurn(tile1: GridTile, tile2: GridTile): boolean {
        return this.isFirstCornerValid(tile1, tile2) || 
               this.isSecondCornerValid(tile1, tile2);
    }

    private isFirstCornerValid(tile1: GridTile, tile2: GridTile): boolean {
        const corner = this.getTileAt(tile1.row, tile2.col);
        return this.isCornerValidForPath(corner, tile1, tile2);
    }

    private isSecondCornerValid(tile1: GridTile, tile2: GridTile): boolean {
        const corner = this.getTileAt(tile2.row, tile1.col);
        return this.isCornerValidForPath(corner, tile1, tile2);
    }

    private checkTwoTurns(tile1: GridTile, tile2: GridTile): boolean {
        return this.hasHorizontalTwoTurnPath(tile1, tile2) ||
               this.hasVerticalTwoTurnPath(tile1, tile2);
    }

    private hasHorizontalTwoTurnPath(tile1: GridTile, tile2: GridTile): boolean {
        for (let col = 0; col < this.columns; col++) {
            if (this.isColumnOccupiedByTiles(col, tile1, tile2)) continue;

            if (this.canConnectThroughHorizontalMidpoint(tile1, tile2, col)) {
                return true;
            }
        }
        return false;
    }

    private hasVerticalTwoTurnPath(tile1: GridTile, tile2: GridTile): boolean {
        for (let row = 0; row < this.rows; row++) {
            if (this.isRowOccupiedByTiles(row, tile1, tile2)) continue;

            if (this.canConnectThroughVerticalMidpoint(tile1, tile2, row)) {
                return true;
            }
        }
        return false;
    }

    private canConnectThroughHorizontalMidpoint(tile1: GridTile, tile2: GridTile, midCol: number): boolean {
        const mid1 = this.getTileAt(tile1.row, midCol);
        const mid2 = this.getTileAt(tile2.row, midCol);
        return this.areMidpointsValidForPath(mid1, mid2, tile1, tile2);
    }

    private canConnectThroughVerticalMidpoint(tile1: GridTile, tile2: GridTile, midRow: number): boolean {
        const mid1 = this.getTileAt(midRow, tile1.col);
        const mid2 = this.getTileAt(midRow, tile2.col);
        return this.areMidpointsValidForPath(mid1, mid2, tile1, tile2);
    }

    private isPathClear(row1: number, col1: number, row2: number, col2: number): boolean {
        if (row1 === row2) {
            return this.isHorizontalPathClear(row1, col1, col2);
        }

        if (col1 === col2) {
            return this.isVerticalPathClear(col1, row1, row2);
        }

        return false;
    }

    private isHorizontalPathClear(row: number, col1: number, col2: number): boolean {
        const minCol = Math.min(col1, col2);
        const maxCol = Math.max(col1, col2);

        for (let col = minCol + 1; col < maxCol; col++) {
            if (!this.isTileEmpty(this.grid[row][col])) {
                return false;
            }
        }
        return true;
    }

    private isVerticalPathClear(col: number, row1: number, row2: number): boolean {
        const minRow = Math.min(row1, row2);
        const maxRow = Math.max(row1, row2);

        for (let row = minRow + 1; row < maxRow; row++) {
            if (!this.isTileEmpty(this.grid[row][col])) {
                return false;
            }
        }
        return true;
    }


    private removeTile(tile: GridTile) {
        this.clearTileHandler(tile);
        this.destroyTileNode(tile);
        this.resetTileToEmpty(tile);
    }

    private clearTileHandler(tile: GridTile) {
        if (tile.handler) {
            tile.handler.clear();
        }
    }

    private destroyTileNode(tile: GridTile) {
        if (tile.node) {
            tile.node.destroy();
            tile.node = null;
        }
    }

    private resetTileToEmpty(tile: GridTile) {
        tile.handler = null;
        tile.type = TileType.EMPTY;
    }

    private onTileSelected(row: number, col: number) {
        const tile = this.getTileAt(row, col);
        if (!this.isTileValidForSelection(tile)) return;

        if (this.isFirstTileSelection()) {
            this.selectFirstTile(tile!);
        } else {
            this.handleSecondTileSelection(tile!);
        }
    }

    private isTileValidForSelection(tile: GridTile | null): boolean {
        return tile !== null && tile.type !== TileType.EMPTY;
    }

    private isFirstTileSelection(): boolean {
        return this.selectedTile === null;
    }

    private selectFirstTile(tile: GridTile) {
        this.selectedTile = tile;
        this.highlightTile(tile, true);
    }

    private handleSecondTileSelection(tile: GridTile) {
        if (!this.selectedTile) return;
        
        if (this.canConnect(this.selectedTile, tile)) {
            this.handleMatchingTiles(this.selectedTile, tile);
        } else {
            this.switchSelectedTile(tile);
        }
    }

    private handleMatchingTiles(tile1: GridTile, tile2: GridTile) {
        const path = this.getConnectionPath(tile1, tile2);
        
        if (this.shouldAnimatePath(path)) {
            this.animatePathAndRemoveTiles(path!, tile1, tile2);
        } else {
            this.removeTilesImmediately(tile1, tile2);
        }
        
        this.clearSelection();
    }

    private shouldAnimatePath(path: PathPoint[] | null): boolean {
        return path !== null && this.pathVisualizer !== null;
    }

    private animatePathAndRemoveTiles(path: PathPoint[], tile1: GridTile, tile2: GridTile) {
        if (!this.pathVisualizer) return;
        
        this.pathVisualizer.drawPath(path, () => {
            this.removeTile(tile1);
            this.removeTile(tile2);
            this.checkGameCompletion();
        });
    }

    private removeTilesImmediately(tile1: GridTile, tile2: GridTile) {
        this.removeTile(tile1);
        this.removeTile(tile2);
        this.checkGameCompletion();
    }

    private clearSelection() {
        this.selectedTile = null;
    }

    private switchSelectedTile(newTile: GridTile) {
        if (this.selectedTile) {
            this.highlightTile(this.selectedTile, false);
        }
        this.selectedTile = newTile;
        this.highlightTile(newTile, true);
    }

    private checkGameCompletion() {
        if (this.isGridEmpty()) {
            this.notifyGameComplete();
        }
    }

    private notifyGameComplete() {
        console.log("Game Complete!");
        if (this.onGameCompleteCallback) {
            this.onGameCompleteCallback();
        }
    }

    private highlightTile(tile: GridTile, highlight: boolean) {
        if (tile.handler) {
            tile.handler.setHighlight(highlight);
        }
    }

    private getTileAt(row: number, col: number): GridTile | null {
        if (this.isValidGridPosition(row, col)) {
            return this.grid[row][col];
        }
        return null;
    }

    private isValidGridPosition(row: number, col: number): boolean {
        return row >= 0 && row < this.rows && col >= 0 && col < this.columns;
    }


    private isGridEmpty(): boolean {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                if (!this.isTileEmpty(this.grid[row][col])) {
                    return false;
                }
            }
        }
        return true;
    }

    private shuffleArray<T>(array: T[]): void {
        for (let i = array.length - 1; i > 0; i--) {
            this.swapArrayElements(array, i, this.getRandomIndex(i + 1));
        }
    }

    private swapArrayElements<T>(array: T[], index1: number, index2: number) {
        [array[index1], array[index2]] = [array[index2], array[index1]];
    }

    private getRandomIndex(max: number): number {
        return Math.floor(Math.random() * max);
    }

    hasValidMoves(): boolean {
        const activeTiles = this.collectActiveTiles();
        return this.anyTilesCanConnect(activeTiles);
    }

    private collectActiveTiles(): GridTile[] {
        const tiles: GridTile[] = [];

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                if (!this.isTileEmpty(this.grid[row][col])) {
                    tiles.push(this.grid[row][col]);
                }
            }
        }

        return tiles;
    }

    private anyTilesCanConnect(tiles: GridTile[]): boolean {
        for (let i = 0; i < tiles.length; i++) {
            for (let j = i + 1; j < tiles.length; j++) {
                if (this.canConnect(tiles[i], tiles[j])) {
                    return true;
                }
            }
        }
        return false;
    }

    restartGame() {
        this.clearSelectedTile();
        this.initializeGrid();
    }

    private clearSelectedTile() {
        this.selectedTile = null;
    }

    shuffleRemainingTiles() {
        const remainingTypes = this.collectRemainingTileTypes();
        this.shuffleArray(remainingTypes);
        this.redistributeTileTypes(remainingTypes);
        this.renderGrid();
    }

    private collectRemainingTileTypes(): TileType[] {
        const types: TileType[] = [];

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                if (!this.isTileEmpty(this.grid[row][col])) {
                    types.push(this.grid[row][col].type);
                    this.removeTile(this.grid[row][col]);
                }
            }
        }

        return types;
    }

    private redistributeTileTypes(types: TileType[]) {
        let index = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                if (this.hasMoreTiles(index, types)) {
                    this.grid[row][col].type = types[index];
                    index++;
                }
            }
        }
    }
}



