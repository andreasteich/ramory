import { ArrowRightIcon } from "@heroicons/react/outline";
import { ActionFunction, redirect } from "@remix-run/cloudflare";
import { Form } from "@remix-run/react";
import Toast from "~/components/Toast";
import { constructUrlForDo } from "~/utils";

export const action: ActionFunction = async ({ context, request }) => {
  const { allowedPlayersInTotal, topic } = Object.fromEntries(await request.formData())

  const payload = {
      isPrivate: true,
      allowedPlayersInTotal,
      topic
  }

  const { env } = context

  const response = await fetch(constructUrlForDo(env.DO_HOST, 'boards'), { 
      method: 'POST',
      body: JSON.stringify(payload)
  })

  const { boardId } = await response.json()

  return redirect(`/boards/${boardId}`)
}

export default function Index() {
  return (
    <div className="flex flex-col gap-20 items-center mx-auto my-0 h-full justify-center">
      <div className="flex flex-col gap-10">
        <h1 className="text-center font-bold text-6xl">RAMory</h1>
<Toast message="Hello World"/>        
        <h2 className="text-center font-semibold text-4xl">How good is your card's memory?</h2>
      </div>
      <Form method="post" className="flex flex-row items-center gap-5 justify-evenly w-full">
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-sm">How many Players?</p>
          <input type="number" min="1" max="10" placeholder="1-10" className="" name="allowedPlayersInTotal" required />
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-bold text-sm">Topic</p>
          <div className="flex flex-col gap-1 items-start">
            <div/>
            <div>
            <input type="radio" id="animals" name="topic" value="animals"/>
            <label htmlFor="animals"> Animals</label>
            </div>
            <div>
            <input type="radio" id="flags" name="topic" value="flags"/>
            <label htmlFor="flags"> Flags</label>
            </div>
            <div>
            <input type="radio" id="fruits" name="topic" value="fruits"/>
            <label htmlFor="fruits"> Food</label>
            </div>
            <div>
            <input type="radio" id="sports" name="topic" value="sports"/>
            <label htmlFor="sports"> Sports</label>
            </div>
            <div>
            <input type="radio" id="vehicles" name="topic" value="vehicles"/>
            <label htmlFor="vehicles"> Vehicles</label>
            </div>
          </div>
        </div>
        <div>
          <button type="submit" className="flex flex-row gap-2 items-center py-2 px-4 text-center bg-pink-500 hover:bg-pink-600 text-white rounded-lg">
            Let's find out
            <ArrowRightIcon className="h-4" />
          </button>
        </div>
      </Form>
    </div>
  );
}
