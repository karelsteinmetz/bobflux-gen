import * as f from '../../flux';

export interface IInnerState extends f.IState {
    some: string;
}

export default(): IInnerState => {
    return {
        some: 'defaultValue'
    };
}
