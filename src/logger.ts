
export interface ILogger {
    info: (message: string, params?: any) => void
    warning: (message: string, params?: any) => void
    error: (message: string, params?: any) => void
    debug: (message: string, params?: any) => void
}

export let create = (enableDebug: boolean = false, enableInfo: boolean = true, enableWarning: boolean = true, enableError: boolean = true): ILogger => {
    return {
        info: (message: string, params?: any) => { enableInfo && (params ? console.log(`Info: ${message}`, params) : console.log(`Info: ${message}`)); },
        warning: (message: string, params?: any) => { enableWarning && (params ? console.log(`Warning: ${message}`, params) : console.log(`Warning: ${message}`)); },
        error: (message: string, params?: any) => { enableError && (params ? console.log(`Error: ${message}`, params) : console.log(`Error: ${message}`)) },
        debug: (message: string, params?: any) => { enableDebug && (params ? console.log(`Debug: ${message}`, params) : console.log(`Debug: ${message}`)); }
    }
} 