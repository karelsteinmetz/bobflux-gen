import * as bf from 'bobflux';
import * as i from './inner/stateInner';

export interface IApplicationState extends bf.IState {
    inner: i.IInnerState
}