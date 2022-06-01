export function constructUrlForDo(doHost: string, path: string, protocolForWebSocket = false) {
    const environmentIsProduction = process.env.NODE_ENV === 'production'
    let protocol = environmentIsProduction ? 'https' : 'http'

    if (protocolForWebSocket) {
        protocol = environmentIsProduction ? 'wss' : 'ws'
    }

    return `${protocol}://${doHost}/${path}`
}

export function historySliceTextColor(type: string) {
    switch (type) {
        case 'info':
            return 'text-white'
        case 'noMatch':
            return 'text-red-500'
        case 'pairFound':
            return 'text-green-500'
        case 'quickReaction':
            return 'text-blue-500'
        default:
            return 'text-white'
    }
}