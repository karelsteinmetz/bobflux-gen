import * as bf from 'bobflux';
import { MyMap as RenamedMyMap, IMapState as IRenamedMapState } from './stateWithType';

export interface IApplicationState extends bf.IState {
    someExternalMap: RenamedMyMap;
    externalState: IRenamedMapState;
}