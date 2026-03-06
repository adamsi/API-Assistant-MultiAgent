declare module 'sockjs-client' {
  interface SockJSOptions {
    server?: string;
    sessionId?: number | (() => number);
    transports?: string | string[];
    timeout?: number;
    devel?: boolean;
    debug?: boolean;
    protocols_whitelist?: string[];
    withCredentials?: boolean;
    headers?: { [key: string]: string };
  }

  class SockJS {
    constructor(url: string, protocols?: string | string[] | null, options?: SockJSOptions);
    
    readonly readyState: number;
    readonly url: string;
    readonly protocol: string;
    readonly extensions: string;
    readonly bufferedAmount: number;
    
    onopen: ((event: Event) => void) | null;
    onmessage: ((event: MessageEvent) => void) | null;
    onclose: ((event: CloseEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    
    send(data: string | ArrayBuffer | Blob): void;
    close(code?: number, reason?: string): void;
    
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
    dispatchEvent(event: Event): boolean;
  }

  export = SockJS;
}
