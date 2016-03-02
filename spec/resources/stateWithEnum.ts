import * as bf from 'bobflux';

export interface IApplicationState extends bf.IState {
    someEnum: SomeEnum
}

export enum SomeEnum {
    Value1,
    Value2
}