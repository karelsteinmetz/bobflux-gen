import * as bf from 'bobflux';

export interface IInnerState extends bf.IState {
    some: string;
}

export default(): IInnerState => {
    return {
        some: 'defaultValue'
    };
}
