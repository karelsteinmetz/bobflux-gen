
export interface ILogger {
    info: (message: string, params?: any) => void
    warning: (message: string, params?: any) => void
    error: (message: string, params?: any) => void
    debug: (message: string, params?: any) => void
}

export let create = (enableDebug: boolean = false, enableInfo: boolean = true, enableWarning: boolean = true, enableError: boolean = true): ILogger => {
    return {
        info: (message: string, params?: any) => { enableInfo && console.log(`Info: ${message}`, params); },
        warning: (message: string, params?: any) => { enableWarning && console.log(`Warning: ${message}`, params); },
        error: (message: string, params?: any) => { enableError && console.log(`Error: ${message}`, params); },
        debug: (message: string, params?: any) => { enableDebug && console.log(`Debug: ${message}`, params); }
    }
} 