declare module "cloudflare:sockets" {
  export interface Socket {
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<Uint8Array>;
    startTls: (options?: any) => Socket;
    close: () => Promise<void>;
  }
  export function connect(
    address: string | { hostname: string; port: number },
    options?: { secureTransport?: "off" | "on" | "starttls"; allowHalfOpen?: boolean }
  ): Socket;
}