import * as bf from 'bobflux';

export interface IMapState extends bf.IComponentState {
    someMap: MyMap;
}

export type MyMap = { [key: string]: string };