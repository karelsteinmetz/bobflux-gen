import * as f from '../flux';

export interface IApplicationState extends f.IRouteComponentState {
    generic: IGenericState<string>
}

export interface IGenericState<T> extends f.IState {
    data: T;
}
