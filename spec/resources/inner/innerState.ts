import * as f from '../../flux';
import * as sms from './some/someState';
import * as smt from './some/someType';

export interface IInnerState extends f.IRouteComponentState {
    someState: sms.ISomeState;
    someType: smt.ISomeState;
}

export default (): IInnerState => {
    return {
        someState: sms.default(),
        someType: sms.default()
    };
}
