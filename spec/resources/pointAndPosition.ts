
export class PositionDto {
    x: number;
    y: number;
};

export class PointBaseDto {
    position: PositionDto;
}

export class PointDto extends PointBaseDto {
    id: string;
};