import type { HexCoordinate } from '../coordinates';

/**
 * HexSegment type represents a segment of a hexagon.
 * It can take values from 0 to 5, representing the six segments of a hexagon.
 * 0 is the top segment, 1 is the top-right segment, and so on in clockwise order.
 */
export type HexSegment = 0 | 1 | 2 | 3 | 4 | 5;

export interface CellSegmentStyle {
    render: boolean;
    width: number;
    color: string;
}

export interface CellRenderState {
    coordinate: HexCoordinate;
    segments: Record<HexSegment, CellSegmentStyle>;
}
