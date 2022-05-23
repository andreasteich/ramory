export function constructUrl(host: string, path: string, protocolIsWebsocket = false): string {
    const environmentIsProduction = process.env.NODE_ENV === 'production'

    let protocol = environmentIsProduction  ? 'https' : 'http'

    if (protocolIsWebsocket) {
        protocol = environmentIsProduction ? 'wss' : 'ws'   
    }
    
    return `${protocol}://${host}/${path}`
}