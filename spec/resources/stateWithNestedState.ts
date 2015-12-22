import * as bf from 'bobflux';

export interface IApplicationState extends bf.IState {
	stringValue: string
}

export interface INestedState extends bf.IState {
    numberValue: string
}