import * as f from '../../../flux';

export interface ISomeState extends f.IState {
    someField: string;
}

export default(): ISomeState => {
    return {
        someField: 'defaultValueOfSomeField'
    };
}
