import * as bf from 'bobflux';
import * as s from './inner/stateInner';

export interface IApplicationState extends bf.IState {
    inner: s.IInnerState
}