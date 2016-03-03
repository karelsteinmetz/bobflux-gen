import * as f from '../flux';
import * as s from './inner/stateInner';

export interface IApplicationState extends f.IState {
    inner: s.IInnerState
}