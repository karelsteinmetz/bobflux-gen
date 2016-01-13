import * as bf from 'bobflux';

export interface IApplicationState extends bf.IState {
    strings: string[]
    numbers: INumber[]
}

export interface INumber {
    value: number
}