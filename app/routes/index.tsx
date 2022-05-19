import { ActionFunction, json, LoaderFunction, redirect, Session } from "@remix-run/cloudflare";
import { Form, Link } from "@remix-run/react";

export const loader: LoaderFunction = async ({ context, request }) => {
  const session = await context.sessionStorage.getSession(
    request.headers.get("Cookie")
  );

  if (session.has('username')) {
    return redirect('/rams')
  }

  return json(null)
}

export const action: ActionFunction = async ({ context, request }) => {
  const form = await request.formData();
  const username = form.get("username");

  const session = await context.sessionStorage.getSession(
    request.headers.get("Cookie")
  );

  session.set('username', username)

  /*if (session) {
    // session.flash("error", "Invalid username/password");
    return redirect("/rams");
  } else {
    
  }*/

  return redirect("/rams", {
    headers: {
      "Set-Cookie": await context.sessionStorage.commitSession(session),
    },
  });
}

export default function Index() {
  return (
    <div className="flex flex-col gap-20 items-center mx-auto my-0 h-full justify-center">
      <div className="flex flex-col gap-10">
        <h1 className="text-center font-bold text-6xl">RAMory</h1>
        <h2 className="text-center font-semibold text-4xl">How much memory do you have?</h2>
      </div>
      <Form method="post" className="flex flex-col items-center gap-5">
        <input type="text" placeholder="Enter username" name="username" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
        <button type="submit" className="py-2 w-full text-center bg-pink-500 hover:bg-pink-600 text-white text-2xl rounded-lg">Let's find out</button>
      </Form>
    </div>
  );
}
