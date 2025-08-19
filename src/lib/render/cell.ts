import { HexDirection, type HexCoordinate } from '../coordinates';

export type CellSegmentType = 'normal' | 'thick';
export type ContentType = 'clue' | 'guess' | 'wrong';
export type BackgroundType = 'none' | 'selected' | 'highlighted';
export interface CellSegmentStyle {
    render: boolean;
    type: CellSegmentType;
}

export interface CellRenderState {
    coordinate: HexCoordinate;
    segments: Record<HexDirection, CellSegmentStyle | null>;
    contents: string | null;
    contentType: ContentType | null;
    backgroundType: BackgroundType;
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
