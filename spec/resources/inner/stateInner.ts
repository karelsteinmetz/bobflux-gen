import * as f from '../../flux';
import * as sm from './some/someState';

export interface IInnerState extends f.IRouteComponentState {
    some: sm.ISomeState;
}

export default(): IInnerState => {
    return {
        some: sm.default()
    };
}
