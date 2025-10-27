import { _decorator, Component, Node, Button, Label } from 'cc';
import { GridManager } from './GridManager';
const { ccclass, property } = _decorator;

export enum GameState {
    PLAYING,
    COMPLETED,
    PAUSED
}

@ccclass('GameManager')
export class GameManager extends Component {
    declare node: Node;

    @property(GridManager)
    gridManager: GridManager | null = null;

    @property(Node)
    gameCompletePanel: Node = null;

    @property(Button)
    cornerRestartButton: Button = null;

    @property(Button)
    panelRestartButton: Button = null;

    @property(Label)
    completeMessageLabel: Label = null;

    private currentState: GameState = GameState.PLAYING;

    start() {
        this.initializeGame();
    }

    private initializeGame() {
        this.setupInitialGameState();
        this.attachButtonEvents();
        this.connectToGridManager();
        this.startNewGame();
    }

    private connectToGridManager() {
        if (this.gridManager) {
            this.gridManager.setGameCompleteCallback(() => {
                this.onGameComplete();
            });
        }
    }

    private setupInitialGameState() {
        this.currentState = GameState.PLAYING;
        this.hideGameCompletePanel();
        this.showCornerRestartButton();
    }

    private attachButtonEvents() {
        this.attachCornerRestartButtonEvent();
        this.attachPanelRestartButtonEvent();
    }

    private attachCornerRestartButtonEvent() {
        if (!this.cornerRestartButton) return;

        this.cornerRestartButton.node.on(Button.EventType.CLICK, () => {
            this.onRestartButtonClicked();
        }, this);
    }

    private attachPanelRestartButtonEvent() {
        if (!this.panelRestartButton) return;

        this.panelRestartButton.node.on(Button.EventType.CLICK, () => {
            this.onRestartButtonClicked();
        }, this);
    }

    private startNewGame() {
        this.verifyGridManagerExists();
        this.resetGameState();
        this.initializeGridManager();
    }

    private verifyGridManagerExists() {
        if (!this.gridManager) {
            console.error("GridManager is not assigned to GameManager!");
        }
    }

    private resetGameState() {
        this.currentState = GameState.PLAYING;
        this.hideGameCompletePanel();
    }

    private initializeGridManager() {
        if (this.gridManager) {
            this.gridManager.node.active = true;
        }
    }

    onGameComplete() {
        this.transitionToCompleteState();
        this.displayGameCompletePanel();
    }

    private transitionToCompleteState() {
        this.currentState = GameState.COMPLETED;
    }

    private displayGameCompletePanel() {
        this.showGameCompletePanel();
        this.updateCompleteMessage();
    }

    private showGameCompletePanel() {
        if (this.gameCompletePanel) {
            this.gameCompletePanel.active = true;
        }
    }

    private hideGameCompletePanel() {
        if (this.gameCompletePanel) {
            this.gameCompletePanel.active = false;
        }
    }

    private updateCompleteMessage() {
        if (this.completeMessageLabel) {
            this.completeMessageLabel.string = "Congratulations!\nYou completed the puzzle!";
        }
    }

    private showCornerRestartButton() {
        if (this.cornerRestartButton) {
            this.cornerRestartButton.node.active = true;
        }
    }

    private onRestartButtonClicked() {
        this.restartGame();
    }

    private restartGame() {
        this.hideGameCompletePanel();
        this.resetGridManager();
        this.resetGameState();
    }

    private resetGridManager() {
        if (this.gridManager) {
            this.gridManager.restartGame();
        }
    }

    isPlaying(): boolean {
        return this.currentState === GameState.PLAYING;
    }

    isCompleted(): boolean {
        return this.currentState === GameState.COMPLETED;
    }

    getCurrentState(): GameState {
        return this.currentState;
    }
}

