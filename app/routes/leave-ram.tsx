import { ActionFunction, json, redirect } from "@remix-run/cloudflare"
import { constructUrlForDo } from "~/utils"

export const action: ActionFunction = async ({ context, request }) => {
    const { ramToLeave } = Object.fromEntries(await request.formData())
    const cookie = request.headers.get('Cookie')

    // const session = await context.sessionStorage.getSession(cookie);

    const { env } = context

    // await env.sessionStorage.delete(session.id)
    
    if (!cookie) { return json(null) }

    await fetch(constructUrlForDo(env.DO_HOST, `boards/${ramToLeave}/leave`), {
        method: 'DELETE',
        headers: {
            'Cookie': cookie
        }
    })

    return redirect('/')
}