
export interface ILogger {
    info: (message: string, params?: any) => void
    warning: (message: string, params?: any) => void
    error: (message: string, params?: any) => void
    debug: (message: string, params?: any) => void
}

export let create = (enableDebug: boolean = false) : ILogger => {
    return {
        info: (message: string, params?: any) => { console.log(`Info: ${message}`, params); },
        warning: (message: string, params?: any) => { console.log(`Warning: ${message}`, params); },
        error: (message: string, params?: any) => { console.log(`Error: ${message}`, params); },
        debug: (message: string, params?: any) => { enableDebug && console.log(`Debug: ${message}`, params); }
    }
} 