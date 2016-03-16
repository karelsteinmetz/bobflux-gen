import * as bf from 'bobflux';

export interface IApplicationState extends bf.IState {
    someMap: MyMap;
}

export type MyMap = { [key: string]: string };