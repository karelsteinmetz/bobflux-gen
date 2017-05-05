import * as bf from 'bobflux';

export interface IApplicationState extends bf.IState {
    stringCounts: { [s: string]: number }
    nestedStates: { [s: string]: INestedState }
    genericNestedStates: { [s: string]: IGenericNestedState<INestedState> }
}

export interface INestedState {
    string: string;
}

export interface IGenericNestedState<T> {
    nested: T;
}