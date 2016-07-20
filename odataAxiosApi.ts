import * as a from 'axios';
export module Easit.EomApi.Models {
    
    export interface IGridLayout {
        ID: number
        Name: string
        Decription: string
        Data: string
        Modified: string
    }
    export interface ICategory {
        ID: number
        ParentID: number
        Name: string
        Description: string
        Modified: string
        Data: string
    }
    export interface IGetResponse<T> {
        data: T[];
        totalRowsCount: number;
    }   
    
    export const getGridLayouts = (): Promise<IGetResponse<IGridLayout>> => {
        return new Promise<IGetResponse<GridLayout>>((f, r) => {
            a.get('/eomApi/odata/GridLayouts')
                .then(response => {
                    f({ data: response.data['value'], totalRowsCount: response.data['@odata.count'] });
                })
                .catch(error => {
                    r(error);
                });
        });
    }

    export const getCategories = (): Promise<IGetResponse<ICategory>> => {
        return new Promise<IGetResponse<Category>>((f, r) => {
            a.get('/eomApi/odata/Categories')
                .then(response => {
                    f({ data: response.data['value'], totalRowsCount: response.data['@odata.count'] });
                })
                .catch(error => {
                    r(error);
                });
        });
    }

}