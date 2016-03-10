import * as f from '../flux';
import * as s from './inner/stateInner';

export interface IApplicationState extends f.IRouteComponentState {
    inner: s.IInnerState
}