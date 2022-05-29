import { ArrowRightIcon } from "@heroicons/react/outline";
import { ActionFunction, redirect } from "@remix-run/cloudflare";
import { Form } from "@remix-run/react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useToast } from "~/contexts/ToastContext";
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
  const { addToast } = useToast();

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-16 items-start border-y border-black px-8 py-16">
        <p className="text-4xl">RAMory 🎸</p>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h1 className="text-6xl font-extrabold">How good is your memory?</h1>
            <h2 className="text-lg">Create a board and send it to friends to compete with their memory.</h2>
          </div>
          <Form method="post" className="w-full">
            <button 
              type="submit" 
              className="shadow-[2px_2px_0_0_rgba(0,0,0,1)] bg-[#69E290] w-full rounded-lg border-2 border-black py-2 font-bold"
            >Let's RAMble</button>
          </Form>
        </div>
      </div>
      <div className="flex flex-col gap-16 items-start bg-[#F5CAD1] border-y border-black px-8 py-16">
        <div className="flex flex-col gap-8 items-start">
          <img src="take-a-slot.png" className="object-contain" />
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold">📥 Take a slot</h3>
            <p>Create or join a board and put your card into a available slot.</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-16 items-start bg-[#ED6FA0] border-y border-black px-8 py-16">
        <div className="flex flex-col gap-8 items-start">
          <img src="find-matching-silicons.png" className="object-contain" />
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold">💠️ Find matching silicons</h3>
            <p>Try to find similiar chips to get RAM. Every matching pair increments your RAM by 1000 mb, but avoid different one. They will make you loose 100mb.</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-16 items-start bg-[#82EDE0] border-y border-black py-16">
        <div className="flex flex-col gap-8 items-start">
          <img src="collect-ram.png" className="object-contain" />
          <div className="flex flex-col px-8 gap-4">
            <h3 className="text-lg font-bold">🤑 Collect RAM</h3>
            <p>Increase your total RAM by finding matching silicons. At the end the card with the most memory wins.</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-16 items-start border-y border-black px-8 py-16">
        <Form method="post" className="w-full">
          <button 
            type="submit" 
            className="bg-black text-white w-full rounded-lg py-2 font-bold"
          >Create a board</button>
        </Form>
      </div>
      <div className="flex bg-gray-200 flex-col gap-16 items-start border-y border-black px-8 py-16">
        <p>Footer</p>
      </div>
    </div>
  );
}
