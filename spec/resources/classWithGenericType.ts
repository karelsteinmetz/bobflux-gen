import * as f from '../flux';

export class ApplicationState {
    generic: GenericState<string>
}

export class GenericState<T> {
    data: T;
}