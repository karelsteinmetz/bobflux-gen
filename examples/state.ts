import * as bf from 'bobflux';

export interface IApplicationState extends bf.IState {
	stringValue: string
	numberValue: number
}