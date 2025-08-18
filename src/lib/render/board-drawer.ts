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

    ctx.resetTransform();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const ratio = Math.ceil(window.devicePixelRatio);
    ctx.scale(ratio, ratio);

    ctx.translate(options.padding + gridMetrics.horizontalOffset, options.padding);
    ctx.translate(0.5, 0.5);

    drawBackgroundLayer(ctx, renderPlan, gridMetrics, options);
    drawForegroundLayer(ctx, renderPlan, gridMetrics, options);
}

function drawBackgroundLayer(
    ctx: CanvasRenderingContext2D,
    renderPlan: RenderPlan,
    gridMetrics: HexGridMetrics,
    options: RenderOptions,
) {
    renderPlan.cellsToRender.forEach((cell) => {
        const { x, y } = hexCoordinateToCanvas(cell.coordinate, gridMetrics);

        if (cell.backgroundColor) {
            ctx.fillStyle = cell.backgroundColor;
            fillHexagon(ctx, x, y, gridMetrics);
        }
    });
}

function drawForegroundLayer(
    ctx: CanvasRenderingContext2D,
    renderPlan: RenderPlan,
    gridMetrics: HexGridMetrics,
    options: RenderOptions,
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
                ctx.lineWidth = 1;
                ctx.strokeStyle = 'gray';
                drawHexagonSegment(ctx, x, y, direction, gridMetrics);
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

            ctx.strokeStyle = segment.color;
            drawHexagonSegment(ctx, x, y, direction, gridMetrics);
        }

        if (cell.contents !== null) {
            ctx.fillStyle = cell.contentColor ?? 'black';
            ctx.font = `bold ${digitFontSize}px monospace`;
            drawHexagonContents(ctx, x, y, cell.contents);
        }

        if (cell.centerMarkings !== null) {
            ctx.fillStyle = 'oklch(70.4% 0.14 182.503)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `${markerFontSize}px Arial`;
            ctx.fillText(cell.centerMarkings, x, y);
        }

        if (cell.outerMarkings.length > 0) {
            ctx.fillStyle = 'oklch(69.6% 0.17 162.48)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `${markerFontSize}px Arial`;

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
