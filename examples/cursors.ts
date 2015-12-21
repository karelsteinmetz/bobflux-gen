import * as bf from 'bobflux';
import * as s from './state';

export let appCursor: bf.ICursor<s.IApplicationState> = bf.rootCursor

export let stringValueCursor: bf.ICursor<string> = {
    key: 'stringValue'
}

export let numberValueCursor: bf.ICursor<number> = {
    key: 'numberValue'
}