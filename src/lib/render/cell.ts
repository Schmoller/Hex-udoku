import { HexDirection, type HexCoordinate } from '../coordinates';

export interface CellSegmentStyle {
    render: boolean;
    type: 'normal' | 'thick';
    color: string;
}

export interface CellRenderState {
    coordinate: HexCoordinate;
    segments: Record<HexDirection, CellSegmentStyle | null>;
    contents: string | null;
    contentColor: string | null;
    backgroundColor: string | null;
    centerMarkings: string | null;
    outerMarkings: string[];
}

export const EmptySegmentRenderPattern: Record<HexDirection, CellSegmentStyle | null> = {
    [HexDirection.UpRight]: null,
    [HexDirection.UpLeft]: null,
    [HexDirection.Down]: null,
    [HexDirection.DownLeft]: null,
    [HexDirection.DownRight]: null,
    [HexDirection.Up]: null,
};
