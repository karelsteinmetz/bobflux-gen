import * as bf from 'bobflux';
import * as p from './pointAndPosition';

export interface IApplicationState extends bf.IState {
    stringValue: string;
    point: p.PointDto;
}