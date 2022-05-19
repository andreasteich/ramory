import { ActionFunction, json, redirect } from "@remix-run/cloudflare";

export const action: ActionFunction = async ({ context, request }) => {
    const session = await context.sessionStorage.getSession(
        request.headers.get("Cookie")
    );

    await context.sessionStorage.destroySession(session)

    return redirect('/rams')
}