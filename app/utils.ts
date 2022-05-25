export function constructUrlForDo(doHost: string, path: string, protocolForWebSocket = false) {
    const environmentIsProduction = process.env.NODE_ENV === 'production'
    let protocol = environmentIsProduction ? 'https' : 'http'

    if (protocolForWebSocket) {
        protocol = environmentIsProduction ? 'wss' : 'ws'
    }

    return `${protocol}://${doHost}/${path}`
}