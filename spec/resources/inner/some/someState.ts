import * as f from '../../../flux';

export interface ISomeState extends f.IRouteComponentState {
    someField: string;
}

export default(): ISomeState => {
    return {
        someField: 'defaultValueOfSomeField'
    };
}
