import { ActionFunction, json, redirect } from "@remix-run/cloudflare"

export const action: ActionFunction = async ({ request }) => {
    const { ramToLeave } = Object.fromEntries(await request.formData())

    const cookie = request.headers.get('Cookie')

    if (!cookie) { return json(null) }

    await fetch(`http://192.168.2.62:8787/rams/${ramToLeave}/leave`, {
        method: 'DELETE',
        headers: {
            'Cookie': cookie
        }
    })

    return redirect('/rams')
}