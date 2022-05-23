import { ActionFunction, json, redirect } from "@remix-run/cloudflare"

export const action: ActionFunction = async ({ context, request }) => {
    const { ramToLeave } = Object.fromEntries(await request.formData())

    const cookie = request.headers.get('Cookie')

    if (!cookie) { return json(null) }

    await fetch(`https://ram.ramory.workers.dev/rams/${ramToLeave}/leave`, {
        method: 'DELETE',
        headers: {
            'Cookie': cookie
        }
    })

    return redirect('/rams')
}