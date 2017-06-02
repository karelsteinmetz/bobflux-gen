import * as bf from 'bobflux';

export interface IApplicationState extends bf.IComponentState {
    stringOrNull: string | null;
    optionalString?: string;
    doubleOptionalString?: string | undefined;
}
