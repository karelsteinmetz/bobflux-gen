import * as bf from 'bobflux';

export interface IApplicationState extends bf.IRouteComponentState {
	stringValue: string
    nested: INestedState
    secondNested: ISecondNestedState
}

export interface INestedState extends bf.IComponentState {
    numberValue: number
}

export interface ISecondNestedState extends bf.IComponentState {
    stringValue: string
}

