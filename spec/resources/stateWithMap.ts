import * as bf from 'bobflux';

export interface IApplicationState extends bf.IState {
    stringCounts: { [ s: string] : number }
}