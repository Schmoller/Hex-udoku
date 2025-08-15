import { HexDirection, type HexCoordinate } from '../coordinates';

export interface CellSegmentStyle {
    render: boolean;
    width: number;
    color: string;
}

export interface CellRenderState {
    coordinate: HexCoordinate;
    segments: Record<HexDirection, CellSegmentStyle | null>;
    contents: string | null;
}

export const EmptySegmentRenderPattern: Record<HexDirection, CellSegmentStyle | null> = {
    [HexDirection.UpRight]: null,
    [HexDirection.UpLeft]: null,
    [HexDirection.Down]: null,
    [HexDirection.DownLeft]: null,
    [HexDirection.DownRight]: null,
    [HexDirection.Up]: null,
};
