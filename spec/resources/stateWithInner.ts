import * as f from '../flux';
import * as is from './inner/innerState';
import * as it from './inner/innerType';

export interface IApplicationState extends f.IRouteComponentState {
    innerState: is.IInnerState
    innerType: it.IInnerState
}