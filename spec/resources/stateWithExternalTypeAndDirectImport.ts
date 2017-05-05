import * as bf from 'bobflux';
import { MyMap, IMapState } from './stateWithType';

export interface IApplicationState extends bf.IState {
    someExternalMap: MyMap;
    externalState: IMapState;
}