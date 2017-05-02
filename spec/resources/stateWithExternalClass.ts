import * as bf from 'bobflux';
import * as p from './point';

export interface IApplicationState extends bf.IState {
    stringValue: string;
    point: p.PointDto;
}