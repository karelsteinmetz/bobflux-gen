import * as p from './position';

export class PointBaseDto {
    position: p.PositionDto;
}

export class PointDto extends PointBaseDto {
    id: string;
};