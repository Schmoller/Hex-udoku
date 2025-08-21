import { AllHexDirections } from '../coordinates';
import {
    drawHexagonContents,
    drawHexagonDebugInfo,
    drawHexagonSegment,
    fillHexagon,
    hexCoordinateToCanvas,
    type HexGridMetrics,
} from './hexagons';
import type { RenderPlan } from './render-planner';

const OuterNoteArc = (30 * Math.PI) / 180;
const NormalSegmentWidth = 1;
const ThickSegmentWidth = 3;

interface RenderOptions {
    padding: number;
    showDebugInfo?: boolean;
}

interface Styles {
    lineColor: string;
    clueColor: string;
    guessColor: string;
    wrongColor: string;
    noteOuterColor: string;
    noteCenterColor: string;
    selectedColor: string;
}

export function drawBoard(
    canvas: HTMLCanvasElement,
    renderPlan: RenderPlan,
    gridMetrics: HexGridMetrics,
    options: RenderOptions,
) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return;
    }

    const computedStyles = window.getComputedStyle(canvas);
    const boardStyles: Styles = {
        lineColor: computedStyles.getPropertyValue('--game-board-line-color'),
        clueColor: computedStyles.getPropertyValue('--game-board-clue-color'),
        guessColor: computedStyles.getPropertyValue('--game-board-guess-color'),
        wrongColor: computedStyles.getPropertyValue('--game-board-wrong-color'),
        noteOuterColor: computedStyles.getPropertyValue('--game-board-note-outer-color'),
        noteCenterColor: computedStyles.getPropertyValue('--game-board-note-center-color'),
        selectedColor: computedStyles.getPropertyValue('--game-board-selected-color'),
    };

    ctx.resetTransform();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const ratio = Math.ceil(window.devicePixelRatio);
    ctx.scale(ratio, ratio);

    ctx.translate(options.padding + gridMetrics.horizontalOffset, options.padding);
    ctx.translate(0.5, 0.5);

    drawBackgroundLayer(ctx, renderPlan, gridMetrics, options, boardStyles);
    drawForegroundLayer(ctx, renderPlan, gridMetrics, options, boardStyles);
}

function drawBackgroundLayer(
    ctx: CanvasRenderingContext2D,
    renderPlan: RenderPlan,
    gridMetrics: HexGridMetrics,
    options: RenderOptions,
    styles: Styles,
) {
    renderPlan.cellsToRender.forEach((cell) => {
        const { x, y } = hexCoordinateToCanvas(cell.coordinate, gridMetrics);

        if (cell.backgroundType !== 'none') {
            switch (cell.backgroundType) {
                case 'selected':
                case 'highlighted':
                    ctx.fillStyle = styles.selectedColor;
                    break;
            }
            fillHexagon(ctx, x, y, gridMetrics);
        }
    });
}

function drawForegroundLayer(
    ctx: CanvasRenderingContext2D,
    renderPlan: RenderPlan,
    gridMetrics: HexGridMetrics,
    options: RenderOptions,
    styles: Styles,
) {
    const digitFontSize = Math.floor(gridMetrics.innerSize * 0.85);
    const markerFontSize = Math.floor(gridMetrics.innerSize * 0.35);

    renderPlan.cellsToRender.forEach((cell) => {
        const { x, y } = hexCoordinateToCanvas(cell.coordinate, gridMetrics);

        if (options.showDebugInfo) {
            drawHexagonDebugInfo(ctx, cell.coordinate, gridMetrics);
        }

        for (const direction of AllHexDirections) {
            const segment = cell.segments[direction];
            if (!segment || !segment.render) {
                continue;
            }

            switch (segment.type) {
                case 'thick':
                    ctx.lineWidth = ThickSegmentWidth;
                    break;
                case 'normal':
                default:
                    ctx.lineWidth = NormalSegmentWidth;
                    break;
            }

            ctx.strokeStyle = styles.lineColor;
            drawHexagonSegment(ctx, x, y, direction, gridMetrics);
        }

        if (cell.contents !== null) {
            switch (cell.contentType) {
                case 'clue':
                    ctx.fillStyle = styles.clueColor;
                    break;
                case 'guess':
                    ctx.fillStyle = styles.guessColor;
                    break;
                case 'wrong':
                    ctx.fillStyle = styles.wrongColor;
                    break;
            }
            ctx.font = `bold ${digitFontSize}px Dosis`;
            drawHexagonContents(ctx, x, y, cell.contents);
        }

        if (cell.centerMarkings !== null) {
            ctx.fillStyle = styles.noteCenterColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `${markerFontSize}px Dosis`;
            ctx.fillText(cell.centerMarkings, x, y);
        }

        if (cell.outerMarkings.length > 0) {
            ctx.fillStyle = styles.noteOuterColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `${markerFontSize}px Dosis`;

            let startAngle = -((cell.outerMarkings.length - 1) / 2) * OuterNoteArc;
            for (const mark of cell.outerMarkings) {
                let arcX = Math.sin(startAngle) * (gridMetrics.innerSize * 0.6);
                let arcY = -Math.cos(startAngle) * (gridMetrics.innerSize * 0.6);

                ctx.fillText(mark, x + arcX, y + arcY);

                startAngle += OuterNoteArc;
            }
        }
    });
}
