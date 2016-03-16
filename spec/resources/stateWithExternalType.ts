import * as bf from 'bobflux';
import * as e from './stateWithType';

export interface IApplicationState extends bf.IState {
    someExternalMap: e.MyMap;
    externalState: e.IMapState
}