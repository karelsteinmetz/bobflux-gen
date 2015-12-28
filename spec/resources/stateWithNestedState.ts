import * as bf from 'bobflux';

export interface IApplicationState extends bf.IState {
	stringValue: string
    nested: INestedState
    secondNested: ISecondNestedState
}

export interface INestedState extends bf.IState {
    numberValue: number
}

export interface ISecondNestedState extends bf.IState {
    stringValue: string
}

